import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employees.entity';
import { DashboardStats } from './entities/dashboard-stats.entity';

@Resolver(() => Employee)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Query(() => [Employee], { name: 'employees' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Query(() => Employee, { name: 'employee', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.employeesService.findOne(id);
  }

  @Query(() => Employee, { name: 'employeeByUserId', nullable: true })
  findByUserId(@Args('userId', { type: () => ID }) userId: string) {
    return this.employeesService.findByUserId(userId);
  }

  @Query(() => DashboardStats, { name: 'dashboardStats' })
  getDashboardStats() {
    return this.employeesService.getDashboardStats();
  }

  @Mutation(() => Employee, { name: 'createEmployee' })
  create(
    @Args('email') email: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('positionId', { type: () => ID }) positionId: string,
    @Args('departmentId', { type: () => ID, nullable: true }) departmentId?: string,
  ) {
    return this.employeesService.create(email, firstName, lastName, positionId, departmentId);
  }

  @Mutation(() => Employee, { name: 'updateEmployee' })
  update(
    @Args('id', { type: () => ID }) id: string,
    @Args('positionId', { type: () => ID, nullable: true }) positionId?: string,
    @Args('departmentId', { type: () => ID, nullable: true }) departmentId?: string,
  ) {
    return this.employeesService.updateEmployee(id, { positionId, departmentId });
  }

  @Mutation(() => Employee, { name: 'updateEmployeeProfile' })
  updateProfile(
    @Args('id', { type: () => ID }) id: string,
    @Args('phone', { nullable: true }) phone?: string,
    @Args('additionalInfo', { nullable: true }) additionalInfo?: string,
  ) {
    return this.employeesService.updateEmployeeProfile(id, { phone, additionalInfo });
  }
}
