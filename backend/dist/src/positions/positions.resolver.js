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
exports.PositionsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const positions_service_1 = require("./positions.service");
const positions_entity_1 = require("./entities/positions.entity");
let PositionsResolver = class PositionsResolver {
    positionsService;
    constructor(positionsService) {
        this.positionsService = positionsService;
    }
    findAll() {
        return this.positionsService.findAll();
    }
    findOne(id) {
        return this.positionsService.findOne(id);
    }
    create(title, departmentId, description, standardDurationDays) {
        return this.positionsService.create({ title, departmentId, description, standardDurationDays });
    }
    delete(id) {
        return this.positionsService.delete(id);
    }
};
exports.PositionsResolver = PositionsResolver;
__decorate([
    (0, graphql_1.Query)(() => [positions_entity_1.Position], { name: 'positions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PositionsResolver.prototype, "findAll", null);
__decorate([
    (0, graphql_1.Query)(() => positions_entity_1.Position, { name: 'position' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PositionsResolver.prototype, "findOne", null);
__decorate([
    (0, graphql_1.Mutation)(() => positions_entity_1.Position, { name: 'createPosition' }),
    __param(0, (0, graphql_1.Args)('title')),
    __param(1, (0, graphql_1.Args)('departmentId')),
    __param(2, (0, graphql_1.Args)('description', { nullable: true })),
    __param(3, (0, graphql_1.Args)('standardDurationDays', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", void 0)
], PositionsResolver.prototype, "create", null);
__decorate([
    (0, graphql_1.Mutation)(() => positions_entity_1.Position, { name: 'deletePosition' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PositionsResolver.prototype, "delete", null);
exports.PositionsResolver = PositionsResolver = __decorate([
    (0, graphql_1.Resolver)(() => positions_entity_1.Position),
    __metadata("design:paramtypes", [positions_service_1.PositionsService])
], PositionsResolver);
//# sourceMappingURL=positions.resolver.js.map