import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskListEntity } from './task-list.entity';
import { TodoistModule } from '../todoist/todoist.module';
import { TaskListService } from './task-list.service';
import { TaskListResolver } from './task-list.resolver';

@Module({  imports: [TypeOrmModule.forFeature([TaskListEntity])],
    providers: [TaskListService, TaskListResolver],
    exports: [TaskListService]})
export class TaskListModule {}
