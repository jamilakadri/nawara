import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.position.findMany();
  }

  findOne(id: string) {
    return this.prisma.position.findUnique({ where: { id } });
  }

  async create(data: {
    title: string;
    description?: string;
    standardDurationDays?: number;
    departmentId: string;
  }) {
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

  async delete(id: string) {
    const pos = await this.prisma.position.findUnique({ where: { id } });
    if (!pos) throw new NotFoundException('Position not found');
    await this.prisma.position.delete({ where: { id } });
    return pos;
  }
}
