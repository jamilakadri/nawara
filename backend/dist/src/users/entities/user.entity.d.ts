export declare enum Role {
    ADMINRH = "ADMINRH",
    MANAGER = "MANAGER",
    SALARIE = "SALARIE"
}
export declare class User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
