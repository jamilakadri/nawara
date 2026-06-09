import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Position } from '../../positions/entities/positions.entity';

@ObjectType()
export class Department {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  managerId?: string;

  @Field(() => User, { nullable: true })
  manager?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  managerFirstName?: string;

  @Field({ nullable: true })
  managerLastName?: string;

  @Field(() => Int, { nullable: true })
  employeeCount?: number;

  @Field(() => [Position], { nullable: true })
  positions?: Position[];
}

