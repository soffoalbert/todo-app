import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class TaskListBeUpdatedInput {
    @Field(type => ID)
    id: string;

    @Field({ nullable: false })
    name: string;
}