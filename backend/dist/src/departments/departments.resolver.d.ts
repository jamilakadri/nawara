import { DepartmentsService } from './departments.service';
import { Department } from './entities/departments.entity';
import { UsersService } from '../users/users.service';
export declare class DepartmentsResolver {
    private readonly service;
    private readonly usersService;
    constructor(service: DepartmentsService, usersService: UsersService);
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
    create(name: string, description?: string, managerId?: string): Promise<{
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
    manager(department: Department): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    positions(department: Department): Promise<{
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
}
