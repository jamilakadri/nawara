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
exports.PositionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PositionsService = class PositionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.position.findMany();
    }
    findOne(id) {
        return this.prisma.position.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.position.create({
            data: {
                title: data.title,
                description: data.description,
                standardDurationDays: data.standardDurationDays ?? 30,
                departmentId: data.departmentId,
                requiredSkills: [],
                mandatoryDocuments: [],
                requiredEquipment: [],
                mandatoryTrainings: [],
            },
        });
    }
    async delete(id) {
        const pos = await this.prisma.position.findUnique({ where: { id } });
        if (!pos)
            throw new common_1.NotFoundException('Position not found');
        await this.prisma.position.delete({ where: { id } });
        return pos;
    }
};
exports.PositionsService = PositionsService;
exports.PositionsService = PositionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PositionsService);
//# sourceMappingURL=positions.service.js.map