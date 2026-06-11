import { Role } from '../entities/user.entity';
export declare class CreateUserInput {
    email: string;
    firstName: string;
    lastName: string;
    role?: Role;
    positionId?: string;
    startDate?: string;
}
