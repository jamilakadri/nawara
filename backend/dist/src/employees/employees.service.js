"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const bcrypt = __importStar(require("bcrypt"));
let EmployeesService = class EmployeesService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
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
    async findOne(id) {
        const emp = await this.prisma.employee.findUnique({
            where: { id },
            include: {
                user: true,
                position: true,
                department: true,
                onboarding: true,
            },
        });
        if (!emp)
            throw new common_1.NotFoundException(`Employee ${id} not found`);
        return this.mapEmployee(emp);
    }
    async findByUserId(userId) {
        const emp = await this.prisma.employee.findFirst({
            where: { userId },
            include: {
                user: true,
                position: true,
                department: true,
                onboarding: { include: { tasks: true, documents: true } },
            },
        });
        if (!emp)
            return null;
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
    async create(email, firstName, lastName, positionId, departmentId, startDate) {
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
    async updateEmployee(id, data) {
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
    async updateEmployeeProfile(id, data) {
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
            await this.notifications.notifyMultipleUsers(adminIds, '📩 Mise à jour du profil salarié', `${employeeName} a mis à jour son profil : téléphone = ${data.phone ?? 'N/A'}, infos supplémentaires = ${data.additionalInfo ?? 'N/A'}.`, 'PROFILE', '/admin/users');
        }
        return this.mapEmployee(emp);
    }
    mapEmployee(emp) {
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
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map