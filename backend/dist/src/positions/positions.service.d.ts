import { PrismaService } from '../prisma/prisma.service';
export declare class PositionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
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
    findOne(id: string): import("@prisma/client").Prisma.Prisma__PositionClient<{
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
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(data: {
        title: string;
        description?: string;
        standardDurationDays?: number;
        departmentId: string;
    }): Promise<{
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
    }>;
    delete(id: string): Promise<{
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
    }>;
}
