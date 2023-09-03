import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { TaskListEntity } from "./task-list.entity";
import { TodoistService } from "../todoist/todoist.service";
import { NewTaskListInput } from "./dto/new-task-list.input";
import { TaskListBeUpdatedInput } from "./dto/task-list-to-modify.input";

@Injectable()
export class TaskListService {

    constructor(@InjectRepository(TaskListEntity) private taskListRepository: Repository<TaskListEntity>) { }

    async create(newTaskInput: NewTaskListInput): Promise<TaskListEntity> {
        const task = new TaskListEntity();
        task.name = newTaskInput.name
        return await this.taskListRepository.save(task)
    }

    async update(taskToUpdate: TaskListBeUpdatedInput): Promise<TaskListEntity> {
        const updatedTaskList = await this.taskListRepository.findOne({ where: { id: taskToUpdate.id } })
        updatedTaskList.name = taskToUpdate.name
        return await this.taskListRepository.save(updatedTaskList)
    }

    async findAll(): Promise<TaskListEntity[]> {
        return await this.taskListRepository.find();
    }


    async findOneById(id: string): Promise<TaskListEntity> {
        const taskList = await this.taskListRepository.findOne({ where: { id: id } })
        if (taskList) {
            return taskList;
        }
        throw new NotFoundException(`Could not find the task with task id: ${id}`);
    }
}