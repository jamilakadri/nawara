import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll() {
    const employees = await this.prisma.employee.findMany({
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: true,
      },
    });
    return employees.map(this.mapEmployee);
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: true,
      },
    });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return this.mapEmployee(emp);
  }

  async findByUserId(userId: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { userId },
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: { include: { tasks: true, documents: true } },
      },
    });
    // Return null gracefully — do NOT throw, so the GraphQL layer
    // returns null instead of an error that crashes the employee dashboard.
    if (!emp) return null;
    return this.mapEmployee(emp);
  }

  async getDashboardStats() {
    const total = await this.prisma.employeeOnboarding.count();
    const inProgress = await this.prisma.employeeOnboarding.count({
      where: { status: 'IN_PROGRESS' },
    });
    const completed = await this.prisma.employeeOnboarding.count({
      where: { status: 'COMPLETED' },
    });
    const pendingDocs = await this.prisma.document.count({
      where: { status: 'PENDING' },
    });
    return { total, inProgress, completed, pendingDocs };
  }

  async create(
    email: string,
    firstName: string,
    lastName: string,
    positionId: string,
    departmentId?: string,
    startDate?: Date,
  ) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'SALARIE',
      },
    });

    const employee = await this.prisma.employee.create({
      data: {
        userId: user.id,
        positionId,
        departmentId,
        startDate: startDate ?? new Date(),
      },
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: true,
      },
    });

    return this.mapEmployee(employee);
  }

  async updateEmployee(
    id: string,
    data: { positionId?: string; departmentId?: string; startDate?: Date },
  ) {
    const emp = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: true,
      },
    });
    return this.mapEmployee(emp);
  }

  async updateEmployeeProfile(id: string, data: { phone?: string; additionalInfo?: string }) {
    const emp = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: true,
        position: true,
        department: true,
        onboarding: true,
      },
    });

    const employeeName = `${emp.user?.firstName ?? ''} ${emp.user?.lastName ?? ''}`.trim();
    const adminIds = await this.notifications.findAdminUserIds();
    if (adminIds.length > 0) {
      await this.notifications.notifyMultipleUsers(
        adminIds,
        '📩 Mise à jour du profil salarié',
        `${employeeName} a mis à jour son profil : téléphone = ${data.phone ?? 'N/A'}, infos supplémentaires = ${data.additionalInfo ?? 'N/A'}.`,
        'PROFILE',
        '/admin/users',
      );
    }

    return this.mapEmployee(emp);
  }

  private mapEmployee(emp: any) {
    return {
      id: emp.id,
      userId: emp.userId,
      departmentId: emp.departmentId,
      positionId: emp.positionId,
      startDate: emp.startDate,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      userEmail: emp.user?.email,
      userFirstName: emp.user?.firstName,
      userLastName: emp.user?.lastName,
      phone: emp.phone,
      additionalInfo: emp.additionalInfo,
      positionTitle: emp.position?.title,
      departmentName: emp.department?.name,
      onboardingStatus: emp.onboarding?.status,
      onboardingProgress: emp.onboarding?.progress ?? 0,
      onboardingId: emp.onboarding?.id ?? null,
    };
  }
}
