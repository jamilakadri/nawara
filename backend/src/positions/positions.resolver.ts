import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { PositionsService } from './positions.service';
import { Position } from './entities/positions.entity';

@Resolver(() => Position)
export class PositionsResolver {
  constructor(private readonly positionsService: PositionsService) {}

  @Query(() => [Position], { name: 'positions' })
  findAll() {
    return this.positionsService.findAll();
  }

  @Query(() => Position, { name: 'position' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.positionsService.findOne(id);
  }

  @Mutation(() => Position, { name: 'createPosition' })
  create(
    @Args('title') title: string,
    @Args('departmentId') departmentId: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('standardDurationDays', { type: () => Int, nullable: true }) standardDurationDays?: number,
  ) {
    return this.positionsService.create({ title, departmentId, description, standardDurationDays });
  }

  @Mutation(() => Position, { name: 'deletePosition' })
  delete(@Args('id', { type: () => ID }) id: string) {
    return this.positionsService.delete(id);
  }
}