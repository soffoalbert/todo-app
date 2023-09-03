import { NewTaskInput } from "./dto/new-task.input";
import { Task } from "./task.model";
import { TaskBeUpdatedInput } from "./dto/task-to-modify.input";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { TaskEntity } from "./task.entity";
import { TodoistService } from "../todoist/todoist.service";
import { TaskListService } from "../task-list/task-list.service";
import { TaskListEntity } from "../task-list/task-list.entity";

@Injectable()
export class TaskService {

    constructor(@InjectRepository(TaskEntity) private taskRepository: Repository<TaskEntity>, private readonly todoistService: TodoistService,
        private readonly taskListService: TaskListService) { }

    async findOneById(id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id: id } })
        if (task) {
            return task;
        }
        throw new NotFoundException(`Could not find the task with task id: ${id}`);
    }

    async findOneByTodistId(id: string): Promise<Task> {
        return await this.taskRepository.findOne({ where: { todoistItemId: id } })
    }

    async findAllUncompletedTasks(): Promise<Task[]> {
        return await this.taskRepository.find({ where: { isCompleted: false } , relations: ['taskList', 'taskList'],})
    }

    async create(newTaskInput: NewTaskInput): Promise<Task> {
        const task = new TaskEntity();
        task.dueDate = newTaskInput.dueDate ? newTaskInput.dueDate : new Date()
        task.isCompleted = newTaskInput.isCompleted ? newTaskInput.isCompleted : false
        task.name = newTaskInput.name
        const todoistItem = await this.todoistService.create(task)
        task.todoistItemId = todoistItem.id

        return await this.taskRepository.save(task)
    }

    async storeFromTodoist(newTaskInput: any): Promise<Task> {
        const task = new TaskEntity();
        task.dueDate = newTaskInput.dueDate ? newTaskInput.dueDate : new Date()
        task.isCompleted = newTaskInput.isCompleted ? newTaskInput.isCompleted : false
        task.name = newTaskInput.name
        task.todoistItemId = newTaskInput.todoistItemId
        return await this.taskRepository.save(task)
    }

    async update(taskToUpdate: any | TaskBeUpdatedInput): Promise<Task> {
        const updatedTask = await this.taskRepository.findOne({ where: { id: taskToUpdate.id }, relations: ['taskList', 'taskList'], })
        updatedTask.dueDate = taskToUpdate.dueDate
        updatedTask.isCompleted = taskToUpdate.isCompleted
        updatedTask.name = taskToUpdate.name
        await this.todoistService.update(updatedTask)
        if (taskToUpdate.isCompleted) {
            await this.todoistService.close(updatedTask.todoistItemId)
        }

        const taskList = new TaskListEntity()
        if (taskToUpdate.taskList && !taskToUpdate.taskList.id) {
            taskList.name = taskToUpdate.taskList.name
            updatedTask.taskList = await this.taskListService.create(taskList)
        } else {
            if (taskToUpdate.taskList) {
                updatedTask.taskList = taskToUpdate.taskList
            }
        }

        return this.taskRepository.save(updatedTask)
    }

    async findAll(): Promise<Task[]> {
        return this.taskRepository.find({ relations: ['taskList', 'taskList'], });
    }
}