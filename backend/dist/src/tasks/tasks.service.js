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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let TasksService = class TasksService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
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
    async findOne(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                assignee: true,
                onboarding: { include: { employee: { include: { user: true } } } },
            },
        });
        if (!task)
            throw new Error(`Task ${id} not found`);
        return this.mapTask(task);
    }
    async findByAssignee(assigneeId) {
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
    async findByOnboarding(onboardingId) {
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
    async findByEmployee(employeeId) {
        const onboarding = await this.prisma.employeeOnboarding.findUnique({
            where: { employeeId },
        });
        if (!onboarding)
            return [];
        return this.findByOnboarding(onboarding.id);
    }
    async findPendingForManager(managerId) {
        const tasks = await this.prisma.task.findMany({
            where: {
                assigneeId: managerId,
                status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.DONE] },
            },
            include: {
                assignee: true,
                onboarding: { include: { employee: { include: { user: true } } } },
            },
            orderBy: { dueDate: 'asc' },
        });
        return tasks.map(this.mapTask);
    }
    async updateStatus(id, status) {
        const task = await this.prisma.task.update({
            where: { id },
            data: {
                status,
                completedAt: status === client_1.TaskStatus.DONE || status === client_1.TaskStatus.VALIDATED
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
    async validateTask(id, validatorId) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                onboarding: { include: { employee: { include: { user: true } } } },
            },
        });
        const result = await this.updateStatus(id, client_1.TaskStatus.VALIDATED);
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
        const employeeUserId = task?.onboarding?.employee?.userId;
        if (employeeUserId) {
            await this.notifications.notifyUser(employeeUserId, '✅ Tâche validée', `Votre tâche "${task?.title}" a été validée par ${validatorLabel}. Félicitations !`, 'TASK', '/employee/tasks');
        }
        return result;
    }
    async rejectTask(id, validatorId) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                onboarding: { include: { employee: { include: { user: true } } } },
            },
        });
        const result = await this.updateStatus(id, client_1.TaskStatus.TODO);
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
        const employeeUserId = task?.onboarding?.employee?.userId;
        if (employeeUserId) {
            await this.notifications.notifyUser(employeeUserId, '🔄 Tâche renvoyée pour correction', `Votre tâche "${task?.title}" a été renvoyée par ${validatorLabel}. Merci de la revoir et de la soumettre à nouveau.`, 'TASK', '/employee/tasks');
        }
        return result;
    }
    async markDone(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                assignee: true,
                onboarding: { include: { employee: { include: { user: true, department: true } } } },
            },
        });
        const result = await this.updateStatus(id, client_1.TaskStatus.DONE);
        const empName = `${task?.onboarding?.employee?.user?.firstName ?? ''} ${task?.onboarding?.employee?.user?.lastName ?? ''}`.trim();
        const taskTitle = task?.title ?? '';
        const managerId = task?.assigneeId;
        if (managerId) {
            await this.notifications.notifyUser(managerId, '📋 Nouvelle soumission de tâche', `${empName} a soumis la tâche "${taskTitle}" — En attente de votre validation.`, 'TASK', '/manager/tasks');
        }
        const adminIds = await this.notifications.findAdminUserIds();
        const filteredAdminIds = adminIds.filter((aid) => aid !== managerId);
        if (filteredAdminIds.length > 0) {
            await this.notifications.notifyMultipleUsers(filteredAdminIds, '📋 Tâche soumise par un salarié', `${empName} a soumis la tâche "${taskTitle}" — En attente de validation.`, 'TASK', '/admin/employees');
        }
        return result;
    }
    async createTask(data) {
        const task = await this.prisma.task.create({
            data: {
                onboardingId: data.onboardingId,
                title: data.title,
                description: data.description,
                assigneeId: data.assigneeId,
                createdById: data.createdById,
                priority: data.priority,
                category: data.category,
                dueDate: data.dueDate,
                status: client_1.TaskStatus.TODO,
            },
            include: {
                assignee: true,
                onboarding: { include: { employee: { include: { user: true } } } },
            },
        });
        const employeeUserId = task?.onboarding?.employee?.userId;
        const assigneeUserId = data.assigneeId;
        if (assigneeUserId) {
            await this.notifications.notifyUser(assigneeUserId, '📌 Nouvelle tâche assignée', `Une nouvelle tâche "${task.title}" vous a été assignée. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`, 'TASK', '/employee/tasks');
        }
        if (employeeUserId && employeeUserId !== assigneeUserId) {
            await this.notifications.notifyUser(employeeUserId, '📋 Nouvelle tâche dans votre parcours', `Une nouvelle tâche "${task.title}" a été ajoutée à votre parcours d'intégration. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`, 'TASK', '/employee/tasks');
        }
        return this.mapTask(task);
    }
    async assignTask(id, assigneeId) {
        const oldTask = await this.prisma.task.findUnique({
            where: { id },
            include: { assignee: true },
        });
        if (!oldTask)
            throw new Error(`Task ${id} not found`);
        const task = await this.prisma.task.update({
            where: { id },
            data: { assigneeId },
            include: {
                assignee: true,
                onboarding: { include: { employee: { include: { user: true } } } },
            },
        });
        if (assigneeId !== oldTask.assigneeId) {
            await this.notifications.notifyUser(assigneeId, '📌 Tâche assignée', `La tâche "${task.title}" vous a été assignée. Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')}.`, 'TASK', '/employee/tasks');
        }
        return this.mapTask(task);
    }
    async recalculateProgress(onboardingId) {
        const allTasks = await this.prisma.task.findMany({ where: { onboardingId } });
        const done = allTasks.filter((t) => t.status === client_1.TaskStatus.DONE || t.status === client_1.TaskStatus.VALIDATED).length;
        const progress = allTasks.length > 0 ? (done / allTasks.length) * 100 : 0;
        await this.prisma.employeeOnboarding.update({
            where: { id: onboardingId },
            data: { progress },
        });
    }
    mapTask(task) {
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
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map