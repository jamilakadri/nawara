import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  async create(createUserInput: CreateUserInput) {
    const rawPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: createUserInput.email,
        firstName: createUserInput.firstName,
        lastName: createUserInput.lastName,
        password: hashedPassword,
        role: (createUserInput.role as Role) || Role.SALARIE,
      },
    });

    await this.mailService.sendWelcomeEmail(
      createUserInput.email,
      createUserInput.firstName || createUserInput.email.split('@')[0],
      rawPassword,
    );

    // If positionId is provided, create an employee profile too
    if (createUserInput.positionId) {
      const position = await this.prisma.position.findUnique({
        where: { id: createUserInput.positionId },
      });

      await this.prisma.employee.create({
        data: {
          userId: user.id,
          positionId: createUserInput.positionId,
          departmentId: position?.departmentId ?? null,
          startDate: createUserInput.startDate
            ? new Date(createUserInput.startDate)
            : new Date(),
        },
      });
    }

    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(
    id: string,
    data: { firstName?: string; lastName?: string; email?: string; role?: string; isActive?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as Role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const employee = await this.prisma.employee.findUnique({
      where: { userId: id },
      include: { onboarding: true },
    });

    if (employee?.onboarding) {
      await this.prisma.document.deleteMany({ where: { onboardingId: employee.onboarding.id } });
      await this.prisma.task.deleteMany({ where: { onboardingId: employee.onboarding.id } });
      await this.prisma.employeeOnboarding.delete({ where: { id: employee.onboarding.id } });
    }

    if (employee) {
      await this.prisma.evaluation.deleteMany({ where: { employeeId: employee.id } });
      await this.prisma.employee.delete({ where: { id: employee.id } });
    }

    await this.prisma.notification.deleteMany({ where: { userId: id } });
    return this.prisma.user.delete({ where: { id } });
  }
}