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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const depts = await this.prisma.department.findMany({
            include: { manager: true, employees: true },
        });
        return depts.map(this.mapDept);
    }
    async findOne(id) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: { manager: true, employees: true },
        });
        return dept ? this.mapDept(dept) : null;
    }
    async create(data) {
        const dept = await this.prisma.department.create({
            data: {
                name: data.name,
                description: data.description,
                managerId: data.managerId || null,
            },
            include: { manager: true, employees: true },
        });
        return this.mapDept(dept);
    }
    async delete(id) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: { manager: true, employees: true },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        await this.prisma.department.delete({ where: { id } });
        return this.mapDept(dept);
    }
    async getPositionsByDepartment(departmentId) {
        return this.prisma.position.findMany({
            where: {
                departmentId: departmentId
            },
        });
    }
    mapDept(dept) {
        return {
            id: dept.id,
            name: dept.name,
            description: dept.description,
            managerId: dept.managerId,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
            managerFirstName: dept.manager?.firstName,
            managerLastName: dept.manager?.lastName,
            employeeCount: dept.employees?.length ?? 0,
        };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map