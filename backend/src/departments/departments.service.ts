import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const depts = await this.prisma.department.findMany({
      include: { manager: true, employees: true },
    });
    return depts.map(this.mapDept);
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { manager: true, employees: true },
    });
    return dept ? this.mapDept(dept) : null;
  }

  async create(data: { name: string; description?: string; managerId?: string }) {
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

  async delete(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { manager: true, employees: true },
    });
    if (!dept) throw new NotFoundException('Department not found');
    await this.prisma.department.delete({ where: { id } });
    return this.mapDept(dept);
  }

  async getPositionsByDepartment(departmentId: string) {
    return this.prisma.position.findMany({
      where: { 
        departmentId: departmentId
      },
    });
  }

  private mapDept(dept: any) {
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
}
