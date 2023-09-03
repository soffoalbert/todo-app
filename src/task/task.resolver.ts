import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Task } from "./task.model";
import { TaskService } from "./task.service";
import { NotFoundException } from "@nestjs/common";
import { NewTaskInput } from "./dto/new-task.input";
import { TaskBeUpdatedInput } from "./dto/task-to-modify.input";

@Resolver(of => Task)
export class TaskResolver {
  constructor(
    private taskService: TaskService,
  ) { }

  @Query(returns => Task)
  async task(@Args('id') id: string): Promise<Task> {
    const task = await this.taskService.findOneById(id);
    if (!task) {
      throw new NotFoundException(id);
    }
    return task;
  }

  @Query(returns => [Task])
  async uncompletedTasks(): Promise<Task[]> {
    return await this.taskService.findAllUncompletedTasks();
  }

  @Query(returns => [Task])
  async tasks(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Mutation(returns => Task)
  async addTask(
    @Args('newTaskData') newTask: NewTaskInput,
  ): Promise<Task> {
    return await this.taskService.create(newTask);
  }

  @Mutation(returns => Task)
  async updateTask(
    @Args('taskToUpdateData') newTask: TaskBeUpdatedInput,
  ): Promise<Task> {
    return await this.taskService.update(newTask);
  }
}