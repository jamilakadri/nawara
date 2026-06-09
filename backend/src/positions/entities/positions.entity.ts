import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Position {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  requiredSkills: string[];

  @Field(() => [String])
  mandatoryDocuments: string[];

  @Field(() => [String])
  requiredEquipment: string[];

  @Field(() => [String])
  mandatoryTrainings: string[];

  @Field(() => Number)
  standardDurationDays: number;

  @Field()                        // ✅ ajouté
  departmentId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}