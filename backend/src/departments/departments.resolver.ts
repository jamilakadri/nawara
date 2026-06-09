import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/departments.entity';
import { Position } from '../positions/entities/positions.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Resolver(() => Department)
export class DepartmentsResolver {
  constructor(
    private readonly service: DepartmentsService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => [Department], { name: 'departments' })
  findAll() {
    return this.service.findAll();
  }

  @Query(() => Department, { name: 'department', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Department, { name: 'createDepartment' })
  create(
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('managerId', { nullable: true }) managerId?: string,
  ) {
    return this.service.create({ name, description, managerId });
  }

  @Mutation(() => Department, { name: 'deleteDepartment' })
  delete(@Args('id', { type: () => ID }) id: string) {
    return this.service.delete(id);
  }

  @ResolveField(() => User, { nullable: true })
  async manager(@Parent() department: Department) {
    if (!department.managerId) return null;
    return this.usersService.findOne(department.managerId);
  }

  @ResolveField(() => [Position], { nullable: true })
  async positions(@Parent() department: Department) {
    return this.service.getPositionsByDepartment(department.id);
  }
}
