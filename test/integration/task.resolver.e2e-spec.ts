import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TaskResolver } from '../../src/task/task.resolver';
import { TaskService } from '../../src/task/task.service';
import { NewTaskInput } from '../../src/task/dto/new-task.input';
import { TaskBeUpdatedInput } from '../../src/task/dto/task-to-modify.input';
import { Task } from '../../src/task/task.model';
import * as request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TaskModule } from '../../src/task/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('TaskResolver (E2E)', () => {
  let app: INestApplication;
  let taskService: TaskService;

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
            dropSchema: true
          }),
        }), GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
        TaskModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    taskService = moduleFixture.get<TaskService>(TaskService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Task queries', () => {
    it('should get a task by ID', async () => {
      const findOneByIdMock = jest
        .spyOn(taskService, 'findOneById')
        .mockResolvedValueOnce({
          id: '1',
          name: 'Test Task',
          isCompleted: false,
          dueDate: new Date(),
          todoistItemId: '123',
          taskList: null,
        } as Task);

      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              task(id: "1") {
                id
                name
                isCompleted
              }
            }
          `,
        })
        .expect(200);

      expect(findOneByIdMock).toHaveBeenCalledWith('1');
      expect(body.data.task).toEqual({
        id: '1',
        name: 'Test Task',
        isCompleted: false,
      });
    });

    it('should get all tasks', async () => {
      const findAllMock = jest
        .spyOn(taskService, 'findAll')
        .mockResolvedValueOnce([
          {
            id: '1',
            name: 'Task 1',
            isCompleted: false,
            dueDate: new Date(),
            todoistItemId: '123',
            taskList: null,
          },
          {
            id: '2',
            name: 'Task 2',
            isCompleted: true,
            dueDate: new Date(),
            todoistItemId: '456',
            taskList: null,
          },
        ] as Task[]);

      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              tasks {
                id
                name
                isCompleted
              }
            }
          `,
        })
        .expect(200);

      expect(findAllMock).toHaveBeenCalled();
      expect(body.data.tasks).toEqual([
        {
          id: '1',
          name: 'Task 1',
          isCompleted: false,
        },
        {
          id: '2',
          name: 'Task 2',
          isCompleted: true,
        },
      ]);
    });

    it('should get all uncompleted tasks', async () => {
      const findAllUncompletedTasksMock = jest
        .spyOn(taskService, 'findAllUncompletedTasks')
        .mockResolvedValueOnce([
          {
            id: '1',
            name: 'Task 1',
            isCompleted: false,
            dueDate: new Date(),
            todoistItemId: '123',
            taskList: null,
          },
          {
            id: '2',
            name: 'Task 2',
            isCompleted: false,
            dueDate: new Date(),
            todoistItemId: '456',
            taskList: null,
          },
        ] as Task[]);

      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              uncompletedTasks {
                id
                name
                isCompleted
              }
            }
          `,
        })
        .expect(200);

      expect(findAllUncompletedTasksMock).toHaveBeenCalled();
      expect(body.data.uncompletedTasks).toEqual([
        {
          id: '1',
          name: 'Task 1',
          isCompleted: false,
        },
        {
          id: '2',
          name: 'Task 2',
          isCompleted: false,
        },
      ]);
    });
  });

  describe('Task mutations', () => {
    it('should add a new task', async () => {
      const createMock = jest
        .spyOn(taskService, 'create')
        .mockResolvedValueOnce({
          id: '3',
          name: 'New Task',
          isCompleted: false,
          dueDate: new Date('2023-09-02T00:00:00Z'),
          todoistItemId: '789',
          taskList: null,
        } as Task);

      const newTaskData: NewTaskInput = {
        name: 'New Task',
        isCompleted: false,
        dueDate: new Date('2023-09-02T00:00:00Z'),
      };

      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              addTask(newTaskData: {
                name: "New Task",
                isCompleted: false,
                dueDate: "2023-09-02T00:00:00Z",
              }) {
                id
                name
                isCompleted
              }
            }
          `,
        })
        .expect(200);

      expect(createMock).toHaveBeenCalledWith(newTaskData);
      expect(body.data.addTask).toEqual({
        id: '3',
        name: 'New Task',
        isCompleted: false,
      });
    });

    it('should update an existing task', async () => {
      const updateMock = jest
        .spyOn(taskService, 'update')
        .mockResolvedValueOnce({
          id: '1',
          name: 'Updated Task',
          isCompleted: true,
          dueDate: new Date('2023-09-02T00:00:00Z'),
          todoistItemId: '123',
          taskList: { id: '1', name: 'test-list' },
        } as Task);

      const taskToUpdateData: TaskBeUpdatedInput = {
        id: '1',
        name: 'Updated Task',
        isCompleted: true,
        dueDate: new Date('2023-09-02T00:00:00Z'),
        taskList: { id: '1', name: 'test-list' },
      };

      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateTask(taskToUpdateData: {
                id: "1",
                name: "Updated Task",
                isCompleted: true,
                dueDate: "2023-09-02T00:00:00Z",
                taskList: { id: "1", name: "test-list" },
              }) {
                id
                name
                isCompleted
              }
            }
          `,
        })
        .expect(200);

      expect(updateMock).toHaveBeenCalledWith(taskToUpdateData);
      expect(body.data.updateTask).toEqual({
        id: '1',
        name: 'Updated Task',
        isCompleted: true,
      });
    });
  });
});


