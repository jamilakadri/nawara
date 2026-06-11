import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, Role } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType()
export class ChangePasswordResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User, { name: 'updateUser' })
  updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('firstName', { nullable: true }) firstName?: string,
    @Args('lastName', { nullable: true }) lastName?: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
    @Args('isActive', { nullable: true }) isActive?: boolean,
  ) {
    return this.usersService.updateUser(id, {
      firstName,
      lastName,
      email,
      role: role as string,
      isActive,
    });
  }

  @Mutation(() => User, { name: 'deleteUser' })
  deleteUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.deleteUser(id);
  }

  @Mutation(() => ChangePasswordResponse, { name: 'changePassword' })
  async changePassword(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<ChangePasswordResponse> {
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
}