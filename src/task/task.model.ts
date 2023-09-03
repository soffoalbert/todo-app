import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { type } from 'os';
import { TaskList } from '../task-list/task-list.model';

@ObjectType()
export class Task {

  @Field(type => ID)
  id: string;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  isCompleted: boolean;

  @Field({ nullable: false })
  dueDate: Date;

  @Field({ nullable: false })
  todoistItemId: string;

  @Field({ nullable: true })
  taskList: TaskList;
}