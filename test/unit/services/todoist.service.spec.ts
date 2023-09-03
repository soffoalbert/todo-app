import { Test, TestingModule } from '@nestjs/testing';
import { TodoistService } from '../../../src/todoist/todoist.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskService } from '../../../src/task/task.service';
import { TaskEntity } from '../../../src/task/task.entity';
import { Task } from 'src/task/task.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoistModule } from '../../../src/todoist/todoist.module';
import { TodoistApi } from '@doist/todoist-api-typescript';

jest.mock('@doist/todoist-api-typescript');

describe('TodoistService', () => {
  let todoistService: TodoistService;
  let configService: ConfigService;
  let taskService: TaskService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTaskService = {
    findOneByTodistId: jest.fn(),
    update: jest.fn(),
    storeFromTodoist: jest.fn(),
  };

  const mockTodoistAPIClient = {
    getTask: jest.fn(),
    addTask: jest.fn(),
    updateTask: jest.fn(),
    closeTask: jest.fn(),
  };

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
            dropSchema: true,
          }),
        }),
        ConfigModule,
        TodoistModule,
      ],
      providers: [
        TodoistService,
        TaskService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'YOUR_TODOIST_API_TOKEN'),
          },
        },
        {
          provide: TodoistApi,
          useValue: {
            getTask: jest.fn(),
            addTask: jest.fn(),
            updateTask: jest.fn(),
            closeTask: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(TaskService)
      .useValue(mockTaskService)
      .compile();

    todoistService = moduleFixture.get<TodoistService>(TodoistService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    taskService = moduleFixture.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sync', () => {
    it('should sync an updated task', async () => {
      const taskBeUpdatedInput = {
        event_data: { id: '12345' },
        event_name: 'item:updated',
      };
      const mockTask = {
        id: '1',
        content: 'Completed Task',
        isCompleted: true,
      };

      (TodoistApi.prototype.getTask as jest.Mock).mockResolvedValue(mockTask);

      mockTaskService.findOneByTodistId.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(mockTask);

      const result = await todoistService.sync(taskBeUpdatedInput);

      expect(result).toEqual(mockTask);
      expect(mockTaskService.findOneByTodistId).toHaveBeenCalledWith('1');
      expect(mockTaskService.update).toHaveBeenCalledWith(mockTask);
    });

    it('should sync a newly added task', async () => {
      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:added',
      };

      const mockTask = {
        id: '1',
        content: 'Completed Task',
        isCompleted: true,
      };

      (TodoistApi.prototype.getTask as jest.Mock).mockResolvedValue(mockTask);

      mockTaskService.findOneByTodistId.mockResolvedValue(null);
      mockTaskService.storeFromTodoist.mockResolvedValue(mockTask);

      const result = await todoistService.sync(taskBeUpdatedInput);

      expect(result).toEqual(mockTask);
      expect(mockTaskService.findOneByTodistId).toHaveBeenCalledWith('1');
      expect(mockTaskService.storeFromTodoist).toHaveBeenCalledWith({
        name: 'Completed Task',
        isCompleted: true,
        todoistItemId: '1',
      });
    });

    it('should handle errors during sync', async () => {
      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:updated',
      };

      mockTodoistAPIClient.getTask.mockRejectedValue(new Error('API Error'));

      try {
        await todoistService.sync(taskBeUpdatedInput);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle errors during sync (item:updated)', async () => {
      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:updated',
      };

      mockTodoistAPIClient.getTask.mockRejectedValue(new Error('API Error'));

      try {
        await todoistService.sync(taskBeUpdatedInput);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle errors during sync (item:added)', async () => {
      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:added',
      };

      mockTodoistAPIClient.getTask.mockRejectedValue(new Error('API Error'));

      try {
        await todoistService.sync(taskBeUpdatedInput);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('create', () => {
    it('should create a new task in Todoist', async () => {
      const newTaskInput: TaskEntity = {
        id: '1',
        name: 'New Task',
        isCompleted: false,
        dueDate: new Date(),
        todoistItemId: null,
        taskList: null
      };

      const todoistApiResponse = { content: 'New Task' };

      (TodoistApi.prototype.addTask as jest.Mock).mockResolvedValue(Promise.resolve(todoistApiResponse));

      const result = await todoistService.create(newTaskInput);

      expect(result).toEqual(todoistApiResponse);
    });

    it('should handle errors during task creation', async () => {
      const newTaskInput: TaskEntity = {
        id: '1',
        name: 'New Task',
        isCompleted: false,
        dueDate: new Date(),
        todoistItemId: null,
        taskList: null
      };

      mockTodoistAPIClient.addTask.mockRejectedValue(new Error('API Error'));

      try {
        await todoistService.create(newTaskInput);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    describe('update', () => {
      it('should update a task in Todoist', async () => {
        const taskToUpdate: TaskEntity = {
          id: '12345',
          name: 'Updated Task',
          isCompleted: true,
          dueDate: new Date(),
          todoistItemId: '67890',
          taskList: null
        };

        const todoistApiResponse = { content: 'Updated Task' };

        (TodoistApi.prototype.updateTask as jest.Mock).mockResolvedValue(Promise.resolve(todoistApiResponse));

        const result = await todoistService.update(taskToUpdate);

        expect(result).toEqual(todoistApiResponse);
      });

      it('should handle errors during task update', async () => {
        const taskToUpdate: TaskEntity = {
          id: '12345',
          name: 'Updated Task',
          isCompleted: true,
          dueDate: new Date(),
          todoistItemId: '67890',
          taskList: null
        };

        mockTodoistAPIClient.updateTask.mockRejectedValue(new Error('API Error'));

        try {
          await todoistService.update(taskToUpdate);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('close', () => {
      it('should close a task in Todoist', async () => {
        (TodoistApi.prototype.closeTask as jest.Mock).mockResolvedValue('12345');

        const result = await todoistService.close('12345');

        expect(result).toEqual('12345');
      });

      it('should handle errors during task closure', async () => {
        mockTodoistAPIClient.closeTask.mockRejectedValue(new Error('API Error'));

        try {
          await todoistService.close('12345');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });
});