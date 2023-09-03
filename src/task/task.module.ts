import { Module, forwardRef } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity';
import { TodoistModule } from '../todoist/todoist.module';
import { TaskListModule } from '../task-list/task-list.module';

@Module({
    imports: [TypeOrmModule.forFeature([TaskEntity]),  forwardRef(() => TodoistModule), TaskListModule],
    providers: [TaskService, TaskResolver],
    exports: [TaskService]
})
export class TaskModule { }
