import { User } from '../../users/entities/user.entity';
import { Position } from '../../positions/entities/positions.entity';
export declare class Department {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
    manager?: User;
    createdAt: Date;
    updatedAt: Date;
    managerFirstName?: string;
    managerLastName?: string;
    employeeCount?: number;
    positions?: Position[];
}
