"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersResolver = exports.ChangePasswordResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const users_service_1 = require("./users.service");
const user_entity_1 = require("./entities/user.entity");
const create_user_input_1 = require("./dto/create-user.input");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let ChangePasswordResponse = class ChangePasswordResponse {
    success;
    message;
};
exports.ChangePasswordResponse = ChangePasswordResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], ChangePasswordResponse.prototype, "success", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], ChangePasswordResponse.prototype, "message", void 0);
exports.ChangePasswordResponse = ChangePasswordResponse = __decorate([
    (0, graphql_1.ObjectType)()
], ChangePasswordResponse);
let UsersResolver = class UsersResolver {
    usersService;
    prisma;
    constructor(usersService, prisma) {
        this.usersService = usersService;
        this.prisma = prisma;
    }
    createUser(createUserInput) {
        return this.usersService.create(createUserInput);
    }
    findAll() {
        return this.usersService.findAll();
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    updateUser(id, firstName, lastName, email, role, isActive) {
        return this.usersService.updateUser(id, {
            firstName,
            lastName,
            email,
            role: role,
            isActive,
        });
    }
    deleteUser(id) {
        return this.usersService.deleteUser(id);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return { success: false, message: 'Utilisateur introuvable.' };
        }
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { success: false, message: 'Mot de passe actuel incorrect.' };
        }
        if (newPassword.length < 8) {
            return { success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' };
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        return { success: true, message: 'Mot de passe mis à jour avec succès.' };
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    __param(0, (0, graphql_1.Args)('createUserInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_input_1.CreateUserInput]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "createUser", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.User], { name: 'users' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "findAll", null);
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.User, { name: 'user' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "findOne", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User, { name: 'updateUser' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('firstName', { nullable: true })),
    __param(2, (0, graphql_1.Args)('lastName', { nullable: true })),
    __param(3, (0, graphql_1.Args)('email', { nullable: true })),
    __param(4, (0, graphql_1.Args)('role', { type: () => user_entity_1.Role, nullable: true })),
    __param(5, (0, graphql_1.Args)('isActive', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "updateUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User, { name: 'deleteUser' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "deleteUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => ChangePasswordResponse, { name: 'changePassword' }),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('currentPassword')),
    __param(2, (0, graphql_1.Args)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "changePassword", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_entity_1.User),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        prisma_service_1.PrismaService])
], UsersResolver);
//# sourceMappingURL=users.resolver.js.map