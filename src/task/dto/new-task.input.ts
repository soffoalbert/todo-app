import { Directive, Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class NewTaskInput {
  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  isCompleted: boolean;

  @Field({ nullable: false })
  dueDate: Date;

}