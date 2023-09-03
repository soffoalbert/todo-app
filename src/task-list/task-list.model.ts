import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TaskList {
  @Field(type => ID)
  id: string;

  @Field({ nullable: true })
  name: string;
}