"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const ai_service_1 = require("../ai/ai.service");
let DocumentsService = class DocumentsService {
    prisma;
    notifications;
    aiService;
    constructor(prisma, notifications, aiService) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.aiService = aiService;
    }
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
    async findOne(id) {
        const doc = await this.prisma.document.findUnique({
            where: { id },
            include: {
                onboarding: { include: { employee: { include: { user: true } } } },
                aiAnalysisResult: true,
            },
        });
        if (!doc)
            throw new common_1.NotFoundException(`Document ${id} not found`);
        return this.mapDocument(doc);
    }
    async findByOnboarding(onboardingId) {
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
    async addDocument(onboardingId, name, type, url) {
        const doc = await this.prisma.document.create({
            data: {
                onboardingId,
                name,
                type,
                url,
                status: client_1.DocumentStatus.PENDING,
            },
            include: {
                onboarding: { include: { employee: { include: { user: true, department: true } } } },
                aiAnalysisResult: true,
            },
        });
        try {
            const analysis = this.aiService.analyzeDocument(name, type);
            await this.aiService.saveAnalysis(doc.id, analysis);
        }
        catch (e) {
            console.warn('AI analysis failed silently for document:', doc.id, e);
        }
        const employeeName = `${doc.onboarding?.employee?.user?.firstName ?? ''} ${doc.onboarding?.employee?.user?.lastName ?? ''}`.trim();
        const adminIds = await this.notifications.findAdminUserIds();
        if (adminIds.length > 0) {
            await this.notifications.notifyMultipleUsers(adminIds, '📎 Nouveau document soumis', `${employeeName} a soumis le document "${name}" (${type}) — En attente de validation.`, 'DOCUMENT', '/admin/documents');
        }
        const employeeId = doc.onboarding?.employee?.id;
        if (employeeId) {
            const managerId = await this.notifications.findEmployeeDepartmentManagerId(employeeId);
            if (managerId && !adminIds.includes(managerId)) {
                await this.notifications.notifyUser(managerId, '📎 Document soumis par un membre de votre équipe', `${employeeName} a soumis le document "${name}" (${type}).`, 'DOCUMENT', '/manager/team');
            }
        }
        return this.mapDocument(doc);
    }
    async validate(id, validatorId) {
        const doc = await this.prisma.document.update({
            where: { id },
            data: { status: client_1.DocumentStatus.VALIDATED },
            include: {
                onboarding: { include: { employee: { include: { user: true } } } },
                aiAnalysisResult: true,
            },
        });
        await this.prisma.documentValidation.create({
            data: { documentId: id, validatorId, status: client_1.DocumentStatus.VALIDATED },
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
            await this.notifications.notifyUser(userId, '✅ Document validé', `Votre document "${doc.name}" a été validé par ${validatorLabel} et archivé avec succès.`, 'DOCUMENT', '/employee/documents');
        }
        return this.mapDocument(doc);
    }
    async reject(id, validatorId, comments) {
        const doc = await this.prisma.document.update({
            where: { id },
            data: { status: client_1.DocumentStatus.REJECTED },
            include: {
                onboarding: { include: { employee: { include: { user: true } } } },
                aiAnalysisResult: true,
            },
        });
        await this.prisma.documentValidation.create({
            data: { documentId: id, validatorId, status: client_1.DocumentStatus.REJECTED, comments },
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
            await this.notifications.notifyUser(userId, '❌ Document rejeté', `Votre document "${doc.name}" a été rejeté par ${validatorLabel}.${comments ? ` Motif : ${comments}` : ' Veuillez le corriger et le soumettre à nouveau.'}`, 'DOCUMENT', '/employee/documents');
        }
        return this.mapDocument(doc);
    }
    mapDocument(doc) {
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
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        ai_service_1.AiService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map