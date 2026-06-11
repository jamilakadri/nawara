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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const employees_service_1 = require("./employees.service");
const employees_entity_1 = require("./entities/employees.entity");
const dashboard_stats_entity_1 = require("./entities/dashboard-stats.entity");
let EmployeesResolver = class EmployeesResolver {
    employeesService;
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    findAll() {
        return this.employeesService.findAll();
    }
    findOne(id) {
        return this.employeesService.findOne(id);
    }
    findByUserId(userId) {
        return this.employeesService.findByUserId(userId);
    }
    getDashboardStats() {
        return this.employeesService.getDashboardStats();
    }
    create(email, firstName, lastName, positionId, departmentId) {
        return this.employeesService.create(email, firstName, lastName, positionId, departmentId);
    }
    update(id, positionId, departmentId) {
        return this.employeesService.updateEmployee(id, { positionId, departmentId });
    }
    updateProfile(id, phone, additionalInfo) {
        return this.employeesService.updateEmployeeProfile(id, { phone, additionalInfo });
    }
};
exports.EmployeesResolver = EmployeesResolver;
__decorate([
    (0, graphql_1.Query)(() => [employees_entity_1.Employee], { name: 'employees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "findAll", null);
__decorate([
    (0, graphql_1.Query)(() => employees_entity_1.Employee, { name: 'employee', nullable: true }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "findOne", null);
__decorate([
    (0, graphql_1.Query)(() => employees_entity_1.Employee, { name: 'employeeByUserId', nullable: true }),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "findByUserId", null);
__decorate([
    (0, graphql_1.Query)(() => dashboard_stats_entity_1.DashboardStats, { name: 'dashboardStats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "getDashboardStats", null);
__decorate([
    (0, graphql_1.Mutation)(() => employees_entity_1.Employee, { name: 'createEmployee' }),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('firstName')),
    __param(2, (0, graphql_1.Args)('lastName')),
    __param(3, (0, graphql_1.Args)('positionId', { type: () => graphql_1.ID })),
    __param(4, (0, graphql_1.Args)('departmentId', { type: () => graphql_1.ID, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "create", null);
__decorate([
    (0, graphql_1.Mutation)(() => employees_entity_1.Employee, { name: 'updateEmployee' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('positionId', { type: () => graphql_1.ID, nullable: true })),
    __param(2, (0, graphql_1.Args)('departmentId', { type: () => graphql_1.ID, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "update", null);
__decorate([
    (0, graphql_1.Mutation)(() => employees_entity_1.Employee, { name: 'updateEmployeeProfile' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('phone', { nullable: true })),
    __param(2, (0, graphql_1.Args)('additionalInfo', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesResolver.prototype, "updateProfile", null);
exports.EmployeesResolver = EmployeesResolver = __decorate([
    (0, graphql_1.Resolver)(() => employees_entity_1.Employee),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesResolver);
//# sourceMappingURL=employees.resolver.js.map