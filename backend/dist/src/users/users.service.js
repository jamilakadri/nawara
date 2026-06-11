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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const mail_service_1 = require("../mail/mail.service");
let UsersService = class UsersService {
    prisma;
    mailService;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async create(createUserInput) {
        const rawPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                email: createUserInput.email,
                firstName: createUserInput.firstName,
                lastName: createUserInput.lastName,
                password: hashedPassword,
                role: createUserInput.role || client_1.Role.SALARIE,
            },
        });
        await this.mailService.sendWelcomeEmail(createUserInput.email, createUserInput.firstName || createUserInput.email.split('@')[0], rawPassword);
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
    findOne(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async updateUser(id, data) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`Utilisateur ${id} introuvable`);
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.role !== undefined)
            updateData.role = data.role;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`Utilisateur ${id} introuvable`);
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map