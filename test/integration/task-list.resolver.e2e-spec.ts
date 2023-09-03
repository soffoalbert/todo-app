import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TaskListService } from '../../src/task-list/task-list.service';
import { NewTaskListInput } from '../../src/task-list/dto/new-task-list.input';
import { TaskListBeUpdatedInput } from '../../src/task-list/dto/task-list-to-modify.input';
import { TaskList } from '../../src/task-list/task-list.model';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TaskListModule } from '../../src/task-list/task-list.module';

describe('TaskListResolver (E2E)', () => {
    let app: INestApplication;
    let taskListService: TaskListService;

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
                }),
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
                TaskListModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        taskListService = moduleFixture.get<TaskListService>(TaskListService);
    });

    afterAll(async () => {
        await app.close();
    });


    describe('TaskList queries', () => {
        it('should get all task lists', async () => {
            const findAllMock = jest
                .spyOn(taskListService, 'findAll')
                .mockResolvedValueOnce([
                    {
                        id: '1',
                        name: 'List 1',
                    },
                    {
                        id: '2',
                        name: 'List 2',
                    },
                ] as TaskList[]);

            const { body } = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                            query {
                            taskLists {
                                id
                                name
                            }
                            }
                        `,
                })
                .expect(200);

            expect(findAllMock).toHaveBeenCalled();
            expect(body.data.taskLists).toEqual([
                {
                    id: '1',
                    name: 'List 1',
                },
                {
                    id: '2',
                    name: 'List 2',
                },
            ]);
        });
    });

    describe('TaskList mutations', () => {
        it('should add a new task list', async () => {
            const createMock = jest
                .spyOn(taskListService, 'create')
                .mockResolvedValueOnce({
                    name: 'New List',
                } as TaskList);

            const newTaskListData: NewTaskListInput = {
                name: 'New List',
            };

            const { body } = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                            mutation {
                            addTaskList(newTaskListData: {
                                name: "New List"
                            }) {
                                name
                            }
                            }
                        `,
                })
                .expect(200);

            expect(createMock).toHaveBeenCalledWith(newTaskListData);
            expect(body.data.addTaskList).toEqual({
                name: 'New List',
            });
        });

        it('should update an existing task list', async () => {
            const updateMock = jest
                .spyOn(taskListService, 'update')
                .mockResolvedValueOnce({
                    id: '1',
                    name: 'Updated List',
                } as TaskList);

            const taskListToUpdateData: TaskListBeUpdatedInput = {
                id: '1',
                name: 'Updated List',
            };

            const { body } = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                            mutation {
                            updateTaskList(taskListToUpdateData: {
                                id: "1",
                                name: "Updated List"
                            }) {
                                id
                                name
                            }
                            }
                        `,
                })
                .expect(200);

            expect(updateMock).toHaveBeenCalledWith(taskListToUpdateData);
            expect(body.data.updateTaskList).toEqual({
                id: '1',
                name: 'Updated List',
            });
        });
    });
});
