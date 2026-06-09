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
exports.DepartmentsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const departments_service_1 = require("./departments.service");
const departments_entity_1 = require("./entities/departments.entity");
const positions_entity_1 = require("../positions/entities/positions.entity");
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/entities/user.entity");
let DepartmentsResolver = class DepartmentsResolver {
    service;
    usersService;
    constructor(service, usersService) {
        this.service = service;
        this.usersService = usersService;
    }
    findAll() {
        return this.service.findAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(name, description, managerId) {
        return this.service.create({ name, description, managerId });
    }
    delete(id) {
        return this.service.delete(id);
    }
    async manager(department) {
        if (!department.managerId)
            return null;
        return this.usersService.findOne(department.managerId);
    }
    async positions(department) {
        return this.service.getPositionsByDepartment(department.id);
    }
};
exports.DepartmentsResolver = DepartmentsResolver;
__decorate([
    (0, graphql_1.Query)(() => [departments_entity_1.Department], { name: 'departments' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsResolver.prototype, "findAll", null);
__decorate([
    (0, graphql_1.Query)(() => departments_entity_1.Department, { name: 'department', nullable: true }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsResolver.prototype, "findOne", null);
__decorate([
    (0, graphql_1.Mutation)(() => departments_entity_1.Department, { name: 'createDepartment' }),
    __param(0, (0, graphql_1.Args)('name')),
    __param(1, (0, graphql_1.Args)('description', { nullable: true })),
    __param(2, (0, graphql_1.Args)('managerId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DepartmentsResolver.prototype, "create", null);
__decorate([
    (0, graphql_1.Mutation)(() => departments_entity_1.Department, { name: 'deleteDepartment' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsResolver.prototype, "delete", null);
__decorate([
    (0, graphql_1.ResolveField)(() => user_entity_1.User, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [departments_entity_1.Department]),
    __metadata("design:returntype", Promise)
], DepartmentsResolver.prototype, "manager", null);
__decorate([
    (0, graphql_1.ResolveField)(() => [positions_entity_1.Position], { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [departments_entity_1.Department]),
    __metadata("design:returntype", Promise)
], DepartmentsResolver.prototype, "positions", null);
exports.DepartmentsResolver = DepartmentsResolver = __decorate([
    (0, graphql_1.Resolver)(() => departments_entity_1.Department),
    __metadata("design:paramtypes", [departments_service_1.DepartmentsService,
        users_service_1.UsersService])
], DepartmentsResolver);
//# sourceMappingURL=departments.resolver.js.map