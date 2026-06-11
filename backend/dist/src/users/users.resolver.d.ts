import { UsersService } from './users.service';
import { Role } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChangePasswordResponse {
    success: boolean;
    message: string;
}
export declare class UsersResolver {
    private readonly usersService;
    private readonly prisma;
    constructor(usersService: UsersService, prisma: PrismaService);
    createUser(createUserInput: CreateUserInput): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateUser(id: string, firstName?: string, lastName?: string, email?: string, role?: Role, isActive?: boolean): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResponse>;
}
