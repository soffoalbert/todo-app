import { Field, InputType,  } from '@nestjs/graphql';

@InputType()
export class NewTaskListInput {
  @Field({ nullable: true })
  id?: string;
  
  @Field({ nullable: false })
  name: string;

}