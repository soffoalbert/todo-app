import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { TaskListService } from "./task-list.service";
import { TaskList } from "./task-list.model";
import { NewTaskListInput } from "./dto/new-task-list.input";
import { TaskListBeUpdatedInput } from "./dto/task-list-to-modify.input";
import { TaskListEntity } from "./task-list.entity";

@Resolver(of => TaskList)
export class TaskListResolver {
  constructor(
    private taskListService: TaskListService,
  ) {}

  @Mutation(returns => TaskList)
  async addTaskList(
    @Args('newTaskListData') newTaskListData: NewTaskListInput,
  ): Promise<NewTaskListInput> {
    const task = await this.taskListService.create(newTaskListData);
    return task;
  }

  @Mutation(returns => TaskList)
  async updateTaskList(
    @Args('taskListToUpdateData') taskListToUpdateData: TaskListBeUpdatedInput,
  ): Promise<TaskListBeUpdatedInput> {
    return await this.taskListService.update(taskListToUpdateData);
  }

  @Query(returns => [TaskList])
  async taskLists(): Promise<TaskListEntity[]> {
    return await this.taskListService.findAll();
  }

}