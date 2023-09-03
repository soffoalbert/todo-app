import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TodoistApi } from "@doist/todoist-api-typescript"
import { TaskService } from '../task/task.service';
import { TaskEntity } from '../task/task.entity';
import { Task } from 'src/task/task.model';

@Injectable()
export class TodoistService {
    private readonly logger = new Logger(TodoistService.name);

    constructor(
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
        private todoistAPIClient: TodoistApi
    ) {
        this.todoistAPIClient = new TodoistApi(this.configService.get<string>('TODOIST_API_TOKEN'));
    }

    async sync(taskBeUpdatedInput: any): Promise<Task> {
        const taskId = taskBeUpdatedInput.event_data.id;
        const task = await this.todoistAPIClient.getTask(taskId)
        const foundTask = await this.taskService.findOneByTodistId(task.id);
        const taskToUpdate = new TaskEntity();
        let res: Task
        try {
            if (task && (taskBeUpdatedInput.event_name === "item:updated" || taskBeUpdatedInput.event_name === "item:completed")) {
                foundTask.isCompleted = task.isCompleted;
                foundTask.name = task.content;
                foundTask.todoistItemId = task.id;
                res = await this.taskService.update(foundTask);
                console.log('after update', res)
            } else if (!foundTask && task && taskBeUpdatedInput.event_name == "item:added") {
                taskToUpdate.name = task.content;
                taskToUpdate.isCompleted = task.isCompleted;
                taskToUpdate.todoistItemId = task.id;
                res = await this.taskService.storeFromTodoist(taskToUpdate);
                console.log('after create', res)
            }
            return res
        } catch (error) {
            this.logger.error(`Error syncing task: ${task} in Todoist`, error);
            throw error;
        }
    }

    async create(newTaskInput: TaskEntity): Promise<any> {
        try {
            return await this.todoistAPIClient.addTask({
                content: newTaskInput.name,
            });
        } catch (error) {
            this.logger.error('Error creating task in Todoist', error);
            throw error;
        }
    }


    async update(newTaskInput: TaskEntity): Promise<any> {
        try {
            return await this.todoistAPIClient.updateTask(newTaskInput.todoistItemId, {
                content: newTaskInput.name,
            });
        } catch (error) {
            this.logger.error('Error updating task in Todoist', error);
            throw error;
        }
    }

    async close(id: string): Promise<any> {
        try {
            return await this.todoistAPIClient.closeTask(id)
        } catch (error) {
            this.logger.error('Error closing task in Todoist', error);
            throw error;
        }
    }
}