import { Test, TestingModule } from '@nestjs/testing';
import { TodoistService } from '../../src/todoist/todoist.service';
import { TaskService } from '../../src/task/task.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { AppModule } from '../../src/app.module';
import { TodoistModule } from '../../src/todoist/todoist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from 'src/task/task.model';

jest.mock('@doist/todoist-api-typescript');

describe('TodoistService (E2E)', () => {
  let app: INestApplication;
  let todoistService: TodoistService;
  let taskService: TaskService;

  const mockTaskService = {
    findOneByTodistId: jest.fn(),
    update: jest.fn(),
    storeFromTodoist: jest.fn(),
  };

  beforeAll(async () => {
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
        AppModule, // Add your AppModule here if needed
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

    app = moduleFixture.createNestApplication();
    await app.init();

    todoistService = moduleFixture.get<TodoistService>(TodoistService);
    taskService = moduleFixture.get<TaskService>(TaskService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sync', () => {
    it('should sync a task when item:updated event occurs', async () => {
      const mockTask = {
        id: '1',
        content: 'Updated Task Content',
        isCompleted: true,
      };
      (TodoistApi.prototype.getTask as jest.Mock).mockResolvedValue(mockTask);

      mockTaskService.findOneByTodistId.mockResolvedValue(mockTask);

      mockTaskService.update.mockResolvedValue(mockTask);

      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:updated',
      };

      const response = await request(app.getHttpServer())
        .post('/todo/sync')
        .send(taskBeUpdatedInput)
        .expect(200);

      expect(mockTaskService.findOneByTodistId).toHaveBeenCalledWith('1');
      expect(mockTaskService.update).toHaveBeenCalledWith(mockTask);
      expect(response.body).toEqual(mockTask);
    });

    it('should create a task when item:added event occurs and task is not found', async () => {
      const mockTask = {
        id: '2',
        content: 'New Task Content',
        isCompleted: false,
      };
      (TodoistApi.prototype.getTask as jest.Mock).mockResolvedValue(mockTask);

      mockTaskService.findOneByTodistId.mockResolvedValue(null);

      const createdTask = {
        id: '2',
        name: 'New Task Content',
        isCompleted: false,
        todoistItemId: '2',
      };
      mockTaskService.storeFromTodoist.mockResolvedValue(createdTask);

      const taskBeAddedInput = {
        event_data: { id: '2' },
        event_name: 'item:added',
      };

      const response = await request(app.getHttpServer())
        .post('/todo/sync')
        .send(taskBeAddedInput)
        .expect(200);

      expect(mockTaskService.findOneByTodistId).toHaveBeenCalledWith('2');
      expect(mockTaskService.storeFromTodoist).toHaveBeenCalledWith({
        name: 'New Task Content',
        isCompleted: false,
        todoistItemId: '2',
      });
      expect(response.body).toEqual(createdTask);
    });

    it('should handle errors and return 500 status on sync failure', async () => {
      (TodoistApi.prototype.getTask as jest.Mock).mockRejectedValue(new Error('Todoist API error'));

      const taskBeUpdatedInput = {
        event_data: { id: '1' },
        event_name: 'item:updated',
      };

      const response = await request(app.getHttpServer())
        .post('/todo/sync')
        .send(taskBeUpdatedInput)
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle item:completed event and update the corresponding task', async () => {
      const mockTask = {
        id: '1',
        content: 'Completed Task',
        isCompleted: true,
      };
      (TodoistApi.prototype.getTask as jest.Mock).mockResolvedValue(mockTask);

      mockTaskService.findOneByTodistId.mockResolvedValue(mockTask);

      mockTaskService.update.mockResolvedValue(mockTask);

      const taskBeCompletedInput = {
        event_data: { id: '1' },
        event_name: 'item:completed',
      };

      const response = await request(app.getHttpServer())
        .post('/todo/sync')
        .send(taskBeCompletedInput)
        .expect(200);

      expect(mockTaskService.findOneByTodistId).toHaveBeenCalledWith('1');
      expect(mockTaskService.update).toHaveBeenCalledWith(mockTask);
      expect(response.body).toEqual(mockTask);
    });
  });
  it('/todoist (GET) should return a response with authentication', async () => {
    const response = await request(app.getHttpServer()).get('/todo/todoist');
 
    expect(response.status).toBe(HttpStatus.FOUND);
  });

  it('/todoist/callback (GET) should handle Todoist callback and redirect', async () => {
    const response = await request(app.getHttpServer()).get('/todo/todoist/callback');

    expect(response.status).toBe(HttpStatus.FOUND);
    expect(response.header.location).toBe('https://todoist.com/oauth/authorize?scope=data%3Aread_write&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Ftodo%2Ftodoist%2Fcallback&client_id=15a7a85211d84e80932956f538d23ce2');
  });

});
