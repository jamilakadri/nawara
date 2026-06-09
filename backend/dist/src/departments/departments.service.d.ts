import { PrismaService } from '../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: any;
        name: any;
        description: any;
        managerId: any;
        createdAt: any;
        updatedAt: any;
        managerFirstName: any;
        managerLastName: any;
        employeeCount: any;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        name: any;
        description: any;
        managerId: any;
        createdAt: any;
        updatedAt: any;
        managerFirstName: any;
        managerLastName: any;
        employeeCount: any;
    } | null>;
    create(data: {
        name: string;
        description?: string;
        managerId?: string;
    }): Promise<{
        id: any;
        name: any;
        description: any;
        managerId: any;
        createdAt: any;
        updatedAt: any;
        managerFirstName: any;
        managerLastName: any;
        employeeCount: any;
    }>;
    delete(id: string): Promise<{
        id: any;
        name: any;
        description: any;
        managerId: any;
        createdAt: any;
        updatedAt: any;
        managerFirstName: any;
        managerLastName: any;
        employeeCount: any;
    }>;
    getPositionsByDepartment(departmentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        requiredSkills: string[];
        mandatoryDocuments: string[];
        requiredEquipment: string[];
        mandatoryTrainings: string[];
        standardDurationDays: number;
        departmentId: string;
    }[]>;
    private mapDept;
}
