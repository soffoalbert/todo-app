import { Module, forwardRef } from '@nestjs/common';
import { TodoistController } from './todoist.contoller';
import { TodoistService } from './todoist.service';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TodoistStrategy } from './todoist.strategy';
import { TaskModule } from '../task/task.module';
import { TodoistApi } from '@doist/todoist-api-typescript';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'todoist' }), forwardRef(() => TaskModule)],
    controllers: [TodoistController],
    providers: [TodoistService, ConfigService, TodoistStrategy, TodoistApi],
    exports: [TodoistService]
})
export class TodoistModule { }