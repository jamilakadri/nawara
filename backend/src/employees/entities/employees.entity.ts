import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Employee {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field()
  positionId: string;

  @Field()
  startDate: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations (nested objects returned with includes)
  @Field({ nullable: true })
  userEmail?: string;

  @Field({ nullable: true })
  userFirstName?: string;

  @Field({ nullable: true })
  userLastName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  additionalInfo?: string;

  @Field({ nullable: true })
  positionTitle?: string;

  @Field({ nullable: true })
  departmentName?: string;

  @Field({ nullable: true })
  onboardingStatus?: string;

  @Field(() => Float, { nullable: true })
  onboardingProgress?: number;

  @Field({ nullable: true })
  onboardingId?: string;
}
