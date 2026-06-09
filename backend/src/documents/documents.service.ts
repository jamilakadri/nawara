import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private aiService: AiService,
  ) {}

  async findAll() {
    const docs = await this.prisma.document.findMany({
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
        aiAnalysisResult: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map(this.mapDocument);
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
        aiAnalysisResult: true,
      },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return this.mapDocument(doc);
  }

  async findByOnboarding(onboardingId: string) {
    const docs = await this.prisma.document.findMany({
      where: { onboardingId },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
        aiAnalysisResult: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map(this.mapDocument);
  }

  async addDocument(onboardingId: string, name: string, type: string, url: string) {
    const doc = await this.prisma.document.create({
      data: {
        onboardingId,
        name,
        type,
        url,
        status: DocumentStatus.PENDING,
      },
      include: {
        onboarding: { include: { employee: { include: { user: true, department: true } } } },
        aiAnalysisResult: true,
      },
    });

    // ── AI Auto-Analysis ──
    try {
      const analysis = this.aiService.analyzeDocument(name, type);
      await this.aiService.saveAnalysis(doc.id, analysis);
    } catch (e) {
      console.warn('AI analysis failed silently for document:', doc.id, e);
    }

    const employeeName = `${doc.onboarding?.employee?.user?.firstName ?? ''} ${doc.onboarding?.employee?.user?.lastName ?? ''}`.trim();

    // 1. Notify ALL HR administrators
    const adminIds = await this.notifications.findAdminUserIds();
    if (adminIds.length > 0) {
      await this.notifications.notifyMultipleUsers(
        adminIds,
        '📎 Nouveau document soumis',
        `${employeeName} a soumis le document "${name}" (${type}) — En attente de validation.`,
        'DOCUMENT',
        '/admin/documents',
      );
    }

    // 2. Notify the department manager if applicable
    const employeeId = doc.onboarding?.employee?.id;
    if (employeeId) {
      const managerId = await this.notifications.findEmployeeDepartmentManagerId(employeeId);
      if (managerId && !adminIds.includes(managerId)) {
        await this.notifications.notifyUser(
          managerId,
          '📎 Document soumis par un membre de votre équipe',
          `${employeeName} a soumis le document "${name}" (${type}).`,
          'DOCUMENT',
          '/manager/team',
        );
      }
    }

    return this.mapDocument(doc);
  }

  async validate(id: string, validatorId: string) {
    const doc = await this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.VALIDATED },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
        aiAnalysisResult: true,
      },
    });
    await this.prisma.documentValidation.create({
      data: { documentId: id, validatorId, status: DocumentStatus.VALIDATED },
    });

    let validatorLabel = "l'équipe RH";
    const validator = await this.prisma.user.findUnique({
      where: { id: validatorId },
      select: { firstName: true, lastName: true },
    });
    if (validator) {
      validatorLabel = `${validator.firstName} ${validator.lastName}`;
    }

    const userId = doc.onboarding?.employee?.userId;
    if (userId) {
      await this.notifications.notifyUser(
        userId,
        '✅ Document validé',
        `Votre document "${doc.name}" a été validé par ${validatorLabel} et archivé avec succès.`,
        'DOCUMENT',
        '/employee/documents',
      );
    }
    return this.mapDocument(doc);
  }

  async reject(id: string, validatorId: string, comments?: string) {
    const doc = await this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.REJECTED },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
        aiAnalysisResult: true,
      },
    });
    await this.prisma.documentValidation.create({
      data: { documentId: id, validatorId, status: DocumentStatus.REJECTED, comments },
    });

    let validatorLabel = "l'équipe RH";
    const validator = await this.prisma.user.findUnique({
      where: { id: validatorId },
      select: { firstName: true, lastName: true },
    });
    if (validator) {
      validatorLabel = `${validator.firstName} ${validator.lastName}`;
    }

    const userId = doc.onboarding?.employee?.userId;
    if (userId) {
      await this.notifications.notifyUser(
        userId,
        '❌ Document rejeté',
        `Votre document "${doc.name}" a été rejeté par ${validatorLabel}.${comments ? ` Motif : ${comments}` : ' Veuillez le corriger et le soumettre à nouveau.'}`,
        'DOCUMENT',
        '/employee/documents',
      );
    }
    return this.mapDocument(doc);
  }

  private mapDocument(doc: any) {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      url: doc.url,
      onboardingId: doc.onboardingId,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      employeeFirstName: doc.onboarding?.employee?.user?.firstName,
      employeeLastName: doc.onboarding?.employee?.user?.lastName,
      aiScore: doc.aiAnalysisResult ? Math.round(doc.aiAnalysisResult.confidence * 100) : null,
    };
  }
}
