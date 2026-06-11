import { InputType, Field } from '@nestjs/graphql';
import { Role } from '../entities/user.entity';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field({ nullable: true })
  positionId?: string;

  @Field({ nullable: true })
  startDate?: string;
}