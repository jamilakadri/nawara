import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum Role {
  ADMINRH = 'ADMINRH',
  MANAGER = 'MANAGER',
  SALARIE = 'SALARIE',
}

registerEnumType(Role, {
  name: 'Role',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Role)
  role: Role;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
