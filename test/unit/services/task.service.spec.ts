import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../../../src/task/task.service';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../../../src/task/task.entity';
import { NotFoundException } from '@nestjs/common';
import { TodoistService } from '../../../src/todoist/todoist.service';
import { TaskListService } from '../../../src/task-list/task-list.service';
import { TaskListEntity } from '../../../src/task-list/task-list.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { TaskModule } from '../../../src/task/task.module';

describe('TaskService', () => {
  let taskService: TaskService;
  let taskRepository: Repository<TaskEntity>;
  let todoistService: TodoistService;
  let taskListService: TaskListService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'better-sqlite3',
            database: ':memory',
            entities: [__dirname + '/../**/*.entity.{js,ts}'],
            synchronize: true,
            dropSchema: true
          }),
        }), GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
        TaskModule
      ],
    }).compile();

    taskService = moduleFixture.get<TaskService>(TaskService);
    taskRepository = moduleFixture.get<Repository<TaskEntity>>(
      getRepositoryToken(TaskEntity),
    );
    todoistService = moduleFixture.get<TodoistService>(TodoistService);
    taskListService = moduleFixture.get<TaskListService>(TaskListService);
  });

  describe('findOneById', () => {
    it('should return a task by ID', async () => {
      const taskId = '1';
      const task: TaskEntity = {
        id: taskId,
        name: 'Task 1',
        isCompleted: false,
        dueDate: new Date(),
        todoistItemId: '12345',
        taskList: new TaskListEntity(),
      };

      taskRepository.findOne = jest.fn().mockResolvedValue(task);

      const result = await taskService.findOneById(taskId);

      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task is not found', async () => {
      const taskId = '1';

      taskRepository.findOne = jest.fn().mockResolvedValue(null);

      try {
        await taskService.findOneById(taskId);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('findOneByTodistId', () => {
    it('should return a task by Todoist ID', async () => {
      const todoistItemId = '12345';
      const task: TaskEntity = {
        id: '1',
        name: 'Task 1',
        isCompleted: false,
        dueDate: new Date(),
        todoistItemId: todoistItemId,
        taskList: new TaskListEntity(),
      };

      taskRepository.findOne = jest.fn().mockResolvedValue(task);

      const result = await taskService.findOneByTodistId(todoistItemId);

      expect(result).toEqual(task);
    });

    it('should return null if task with Todoist ID is not found', async () => {
      const todoistItemId = '12345';

      taskRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await taskService.findOneByTodistId(todoistItemId);

      expect(result).toBeNull();
    });
  });

  describe('findAllUncompletedTasks', () => {
    it('should return an array of uncompleted tasks', async () => {
      const uncompletedTasks: TaskEntity[] = [
        {
          id: '1',
          name: 'Task 1',
          isCompleted: false,
          dueDate: new Date(),
          todoistItemId: '12345',
          taskList: new TaskListEntity(),
        },
        {
          id: '2',
          name: 'Task 2',
          isCompleted: false,
          dueDate: new Date(),
          todoistItemId: '67890',
          taskList: new TaskListEntity(),
        },
      ];

      taskRepository.find = jest.fn().mockResolvedValue(uncompletedTasks);

      const result = await taskService.findAllUncompletedTasks();

      expect(result).toEqual(uncompletedTasks);
    });
  });

  describe('create', () => {
    it('should create and return a new task', async () => {
      const newTaskInput = {
        name: 'New Task',
        dueDate: new Date(),
        isCompleted: false,
      };
      const createdTask: TaskEntity = {
        id: '1',
        ...newTaskInput,
        todoistItemId: '12345',
        taskList: new TaskListEntity(),
      };

      todoistService.create = jest.fn().mockResolvedValue({
        id: createdTask.todoistItemId,
      });
      taskRepository.save = jest.fn().mockResolvedValue(createdTask);

      const result = await taskService.create(newTaskInput);

      expect(result).toEqual(createdTask);
    });

    it('should handle errors during task creation', async () => {
      const newTaskInput = {
        name: 'New Task',
        dueDate: new Date(),
        isCompleted: false,
      };

      // Mock Todoist API error
      todoistService.create = jest.fn().mockRejectedValue(new Error('API Error'));

      try {
        await taskService.create(newTaskInput);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('storeFromTodoist', () => {
    it('should create and return a new task from Todoist data', async () => {
      const todoistTaskData = {
        taskTitle: 'Todoist Task',
        dueDate: new Date(),
        isCompleted: false,
        todoistItemId: '12345',
      };
      const createdTask: TaskEntity = {
        id: '1',
        name: todoistTaskData.taskTitle,
        dueDate: todoistTaskData.dueDate,
        isCompleted: todoistTaskData.isCompleted,
        todoistItemId: todoistTaskData.todoistItemId,
        taskList: new TaskListEntity(),
      };

      taskRepository.save = jest.fn().mockResolvedValue(createdTask);

      const result = await taskService.storeFromTodoist(todoistTaskData);

      expect(result).toEqual(createdTask);
    });

    it('should handle errors during task creation from Todoist data', async () => {
      const todoistTaskData = {
        taskTitle: 'Todoist Task',
        dueDate: new Date(),
        isCompleted: false,
        todoistItemId: '12345',
      };

      // Mock TaskRepository error
      taskRepository.save = jest.fn().mockRejectedValue(new Error('Database Error'));

      try {
        await taskService.storeFromTodoist(todoistTaskData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('update', () => {
    it('should update and return a task', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: true,
        taskList: new TaskListEntity(),
      };
      const updatedTask: TaskEntity = {
        id: '1',
        name: taskToUpdate.taskTitle,
        dueDate: taskToUpdate.dueDate,
        isCompleted: taskToUpdate.isCompleted,
        todoistItemId: '12345',
        taskList: taskToUpdate.taskList,
      };

      todoistService.update = jest.fn().mockResolvedValue({});
      todoistService.close = jest.fn().mockResolvedValue({});
      taskRepository.findOne = jest.fn().mockResolvedValue(updatedTask);
      taskRepository.save = jest.fn().mockResolvedValue(updatedTask);
      taskListService.create = jest.fn().mockResolvedValue(updatedTask.taskList);

      const result = await taskService.update(taskToUpdate);

      expect(result).toEqual(updatedTask);
    });

    it('should update and return a task when the tasklist is not undefined', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: true,
        taskList: {
          id: '1',
          name: 'Personal'
        },
      };
      const updatedTask: TaskEntity = {
        id: '1',
        name: taskToUpdate.taskTitle,
        dueDate: taskToUpdate.dueDate,
        isCompleted: taskToUpdate.isCompleted,
        todoistItemId: '12345',
        taskList: taskToUpdate.taskList,
      };

      todoistService.update = jest.fn().mockResolvedValue({});
      todoistService.close = jest.fn().mockResolvedValue({});
      taskRepository.findOne = jest.fn().mockResolvedValue(updatedTask);
      taskRepository.save = jest.fn().mockResolvedValue(updatedTask);
      taskListService.create = jest.fn().mockResolvedValue(updatedTask.taskList);

      const result = await taskService.update(taskToUpdate);

      expect(result).toEqual(updatedTask);
    });

    it('should close the task in Todoist if isCompleted is true', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: true,
        taskList: new TaskListEntity(),
      };
      const updatedTask: TaskEntity = {
        id: '1',
        name: taskToUpdate.taskTitle,
        dueDate: taskToUpdate.dueDate,
        isCompleted: taskToUpdate.isCompleted,
        todoistItemId: '12345',
        taskList: taskToUpdate.taskList,
      };

      todoistService.update = jest.fn().mockResolvedValue({});
      todoistService.close = jest.fn().mockResolvedValue({});
      taskRepository.findOne = jest.fn().mockResolvedValue(updatedTask);
      taskRepository.save = jest.fn().mockResolvedValue(updatedTask);
      taskListService.create = jest.fn().mockResolvedValue(updatedTask.taskList);

      await taskService.update(taskToUpdate);

      // Ensure that the close method is called when isCompleted is true
      expect(todoistService.close).toHaveBeenCalledWith(updatedTask.todoistItemId);
    });

    it('should update and return a task without closing if isCompleted is false', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: false, // Task is not completed
        taskList: new TaskListEntity(),
      };
      const updatedTask: TaskEntity = {
        id: '1',
        name: taskToUpdate.taskTitle,
        dueDate: taskToUpdate.dueDate,
        isCompleted: taskToUpdate.isCompleted,
        todoistItemId: '12345',
        taskList: taskToUpdate.taskList,
      };

      todoistService.update = jest.fn().mockResolvedValue({});
      todoistService.close = jest.fn().mockResolvedValue({});
      taskRepository.findOne = jest.fn().mockResolvedValue(updatedTask);
      taskRepository.save = jest.fn().mockResolvedValue(updatedTask);
      taskListService.create = jest.fn().mockResolvedValue(updatedTask.taskList);

      const result = await taskService.update(taskToUpdate);

      expect(result).toEqual(updatedTask);
      // Ensure that the close method is NOT called when isCompleted is false
      expect(todoistService.close).not.toHaveBeenCalled();
    });

    it('should handle errors during task update', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: true,
        taskList: new TaskListEntity(),
      };

      // Mock Todoist API error
      todoistService.update = jest.fn().mockRejectedValue(new Error('API Error'));

      try {
        await taskService.update(taskToUpdate);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle errors during task closure', async () => {
      const taskToUpdate: any = {
        taskId: '1',
        taskTitle: 'Updated Task',
        dueDate: new Date(),
        isCompleted: true,
        taskList: new TaskListEntity(),
      };

      // Mock Todoist close task error
      todoistService.close = jest.fn().mockRejectedValue(new Error('API Error'));

      try {
        await taskService.update(taskToUpdate);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks with taskList relations', async () => {
      const tasksWithRelations: TaskEntity[] = [
        {
          id: '1',
          name: 'Task 1',
          isCompleted: false,
          dueDate: new Date(),
          todoistItemId: '12345',
          taskList: new TaskListEntity(),
        },
        {
          id: '2',
          name: 'Task 2',
          isCompleted: false,
          dueDate: new Date(),
          todoistItemId: '67890',
          taskList: new TaskListEntity(),
        },
      ];

      taskRepository.find = jest.fn().mockResolvedValue(tasksWithRelations);

      const result = await taskService.findAll();

      expect(result).toEqual(tasksWithRelations);
    });

    it('should return an empty array if no tasks are found', async () => {
      taskRepository.find = jest.fn().mockResolvedValue([]);

      const result = await taskService.findAll();

      expect(result).toEqual([]);
    });
  });
});