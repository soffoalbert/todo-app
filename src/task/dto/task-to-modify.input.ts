import { Directive, Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { NewTaskListInput } from '../../task-list/dto/new-task-list.input';

@InputType()
export class TaskBeUpdatedInput {
    @Field(type => ID)
    id: string;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    isCompleted: boolean;

    @Field({ nullable: false })
    dueDate: Date;

    @Field({ nullable: true })
    taskList: NewTaskListInput;
}