import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, Priority, TaskCategory } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll() {
    const tasks = await this.prisma.task.findMany({
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks.map(this.mapTask);
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });
    if (!task) throw new Error(`Task ${id} not found`);
    return this.mapTask(task);
  }

  async findByAssignee(assigneeId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { assigneeId },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks.map(this.mapTask);
  }

  async findByOnboarding(onboardingId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { onboardingId },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks.map(this.mapTask);
  }

  async findByEmployee(employeeId: string) {
    const onboarding = await this.prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });
    if (!onboarding) return [];
    return this.findByOnboarding(onboarding.id);
  }

  async findPendingForManager(managerId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: managerId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] },
      },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks.map(this.mapTask);
  }

  async updateStatus(id: string, status: TaskStatus) {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt:
          status === TaskStatus.DONE || status === TaskStatus.VALIDATED
            ? new Date()
            : null,
      },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });

    await this.recalculateProgress(task.onboardingId);
    return this.mapTask(task);
  }

  async validateTask(id: string, validatorId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });

    const result = await this.updateStatus(id, TaskStatus.VALIDATED);

    // Determine the validator name for a professional notification message
    let validatorLabel = 'votre responsable';
    if (validatorId) {
      const validator = await this.prisma.user.findUnique({
        where: { id: validatorId },
        select: { firstName: true, lastName: true, role: true },
      });
      if (validator) {
        validatorLabel =
          validator.role === 'ADMINRH'
            ? `l'équipe RH (${validator.firstName} ${validator.lastName})`
            : `${validator.firstName} ${validator.lastName}`;
      }
    }

    // Notify the employee
    const employeeUserId = task?.onboarding?.employee?.userId;
    if (employeeUserId) {
      await this.notifications.notifyUser(
        employeeUserId,
        '✅ Tâche validée',
        `Votre tâche "${task?.title}" a été validée par ${validatorLabel}. Félicitations !`,
        'TASK',
        '/employee/tasks',
      );
    }

    return result;
  }

  async rejectTask(id: string, validatorId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });

    const result = await this.updateStatus(id, TaskStatus.TODO);

    // Determine the validator name for a professional notification message
    let validatorLabel = 'votre responsable';
    if (validatorId) {
      const validator = await this.prisma.user.findUnique({
        where: { id: validatorId },
        select: { firstName: true, lastName: true, role: true },
      });
      if (validator) {
        validatorLabel =
          validator.role === 'ADMINRH'
            ? `l'équipe RH (${validator.firstName} ${validator.lastName})`
            : `${validator.firstName} ${validator.lastName}`;
      }
    }

    // Notify the employee
    const employeeUserId = task?.onboarding?.employee?.userId;
    if (employeeUserId) {
      await this.notifications.notifyUser(
        employeeUserId,
        '🔄 Tâche renvoyée pour correction',
        `Votre tâche "${task?.title}" a été renvoyée par ${validatorLabel}. Merci de la revoir et de la soumettre à nouveau.`,
        'TASK',
        '/employee/tasks',
      );
    }

    return result;
  }

  async markDone(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true, department: true } } } },
      },
    });

    const result = await this.updateStatus(id, TaskStatus.DONE);

    const empName = `${task?.onboarding?.employee?.user?.firstName ?? ''} ${task?.onboarding?.employee?.user?.lastName ?? ''}`.trim();
    const taskTitle = task?.title ?? '';

    // 1. Notify the assigned manager (if task has an assignee)
    const managerId = task?.assigneeId;
    if (managerId) {
      await this.notifications.notifyUser(
        managerId,
        '📋 Nouvelle soumission de tâche',
        `${empName} a soumis la tâche "${taskTitle}" — En attente de votre validation.`,
        'TASK',
        '/manager/tasks',
      );
    }

    // 2. Notify ALL HR administrators
    const adminIds = await this.notifications.findAdminUserIds();
    // Exclude the assignee if they happen to be an admin (avoid double notification)
    const filteredAdminIds = adminIds.filter((aid) => aid !== managerId);
    if (filteredAdminIds.length > 0) {
      await this.notifications.notifyMultipleUsers(
        filteredAdminIds,
        '📋 Tâche soumise par un salarié',
        `${empName} a soumis la tâche "${taskTitle}" — En attente de validation.`,
        'TASK',
        '/admin/employees',
      );
    }

    return result;
  }

  async createTask(data: {
    onboardingId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    createdById?: string;
    priority: string;
    category: string;
    dueDate: Date;
  }) {
    const task = await this.prisma.task.create({
      data: {
        onboardingId: data.onboardingId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
        priority: data.priority as Priority,
        category: data.category as TaskCategory,
        dueDate: data.dueDate,
        status: TaskStatus.TODO,
      },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });

    // Notify the assignee that a new task was assigned to them
    const employeeUserId = task?.onboarding?.employee?.userId;
    const assigneeUserId = data.assigneeId;

    if (assigneeUserId) {
      await this.notifications.notifyUser(
        assigneeUserId,
        '📌 Nouvelle tâche assignée',
        `Une nouvelle tâche "${task.title}" vous a été assignée. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`,
        'TASK',
        '/employee/tasks',
      );
    }

    // Also notify the onboarding employee if they are different from the assignee
    if (employeeUserId && employeeUserId !== assigneeUserId) {
      await this.notifications.notifyUser(
        employeeUserId,
        '📋 Nouvelle tâche dans votre parcours',
        `Une nouvelle tâche "${task.title}" a été ajoutée à votre parcours d'intégration. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`,
        'TASK',
        '/employee/tasks',
      );
    }

    return this.mapTask(task);
  }

  async assignTask(id: string, assigneeId: string) {
    // Get the task before update to check if assignee changed
    const oldTask = await this.prisma.task.findUnique({
      where: { id },
      include: { assignee: true },
    });
    if (!oldTask) throw new Error(`Task ${id} not found`);

    const task = await this.prisma.task.update({
      where: { id },
      data: { assigneeId },
      include: {
        assignee: true,
        onboarding: { include: { employee: { include: { user: true } } } },
      },
    });

    // Notify the new assignee
    if (assigneeId !== oldTask.assigneeId) {
      await this.notifications.notifyUser(
        assigneeId,
        '📌 Tâche assignée',
        `La tâche "${task.title}" vous a été assignée. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`,
        'TASK',
        '/employee/tasks',
      );
    }

    return this.mapTask(task);
  }

  private async recalculateProgress(onboardingId: string) {
    const allTasks = await this.prisma.task.findMany({ where: { onboardingId } });
    const done = allTasks.filter(
      (t) => t.status === TaskStatus.DONE || t.status === TaskStatus.VALIDATED,
    ).length;
    const progress = allTasks.length > 0 ? (done / allTasks.length) * 100 : 0;
    await this.prisma.employeeOnboarding.update({
      where: { id: onboardingId },
      data: { progress },
    });
  }

  private mapTask(task: any) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      onboardingId: task.onboardingId,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      category: task.category ?? 'ONBOARDING',
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      comments: task.comments,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assigneeFirstName: task.assignee?.firstName,
      assigneeLastName: task.assignee?.lastName,
      employeeFirstName: task.onboarding?.employee?.user?.firstName,
      employeeLastName: task.onboarding?.employee?.user?.lastName,
    };
  }
}
