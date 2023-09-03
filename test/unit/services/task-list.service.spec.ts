import { Test, TestingModule } from '@nestjs/testing';
import { TaskListService } from '../../../src/task-list/task-list.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskListEntity } from '../../../src/task-list/task-list.entity';
import { NotFoundException } from '@nestjs/common';
import { TaskListBeUpdatedInput } from 'src/task-list/dto/task-list-to-modify.input';

describe('TaskListService', () => {
  let taskListService: TaskListService;
  let taskListRepository: Repository<TaskListEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskListService,
        {
          provide: getRepositoryToken(TaskListEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    taskListService = module.get<TaskListService>(TaskListService);
    taskListRepository = module.get<Repository<TaskListEntity>>(
      getRepositoryToken(TaskListEntity),
    );
  });

  describe('create', () => {
    it('should create a new task list', async () => {
      const newTaskListInput = { name: 'Test Task List' };

      const saveMock = jest.fn();
      taskListRepository.save = saveMock;

      const expectedTaskList: TaskListEntity = {
        id: '1',
        name: 'Test Task List',
      };
      saveMock.mockResolvedValue(expectedTaskList);

      const result = await taskListService.create(newTaskListInput);

      expect(result).toEqual(expectedTaskList);
      expect(saveMock).toHaveBeenCalledWith(newTaskListInput);
    });
  });

  describe('update', () => {
    it('should update an existing task list', async () => {
      const taskListId = '1';
      const taskListToUpdate: TaskListBeUpdatedInput = {
        id: taskListId,
        name: 'Updated Task List',
      };

      const findOneMock = jest.fn();
      const saveMock = jest.fn();

      taskListRepository.findOne = findOneMock;
      taskListRepository.save = saveMock;

      const existingTaskList: TaskListEntity = {
        id: taskListId,
        name: 'Old Task List',
      };

      findOneMock.mockResolvedValue(existingTaskList);

      const updatedTaskList: TaskListEntity = {
        id: taskListId,
        name: 'Updated Task List',
      };
      saveMock.mockResolvedValue(updatedTaskList);

      const result = await taskListService.update(taskListToUpdate);

      expect(result).toEqual(updatedTaskList);
      expect(findOneMock).toHaveBeenCalledWith({where: { id: taskListId } });
      expect(saveMock).toHaveBeenCalledWith(existingTaskList);
    });

    it('should throw NotFoundException if task list is not found', async () => {
      const taskListToUpdate: TaskListBeUpdatedInput = {
        id: '1',
        name: 'Updated Task List',
      };

      const findOneMock = jest.fn();
      taskListRepository.findOne = findOneMock;
      findOneMock.mockRejectedValue(new NotFoundException('Task List not found'));;

      try {
        await taskListService.update(taskListToUpdate);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('findAll', () => {
    it('should return all task lists', async () => {
      const taskLists: TaskListEntity[] = [
        { id: '1', name: 'Task List 1' },
        { id: '2', name: 'Task List 2' },
      ];

      const findMock = jest.fn();
      taskListRepository.find = findMock;
      findMock.mockResolvedValue(taskLists);

      const result = await taskListService.findAll();

      expect(result).toEqual(taskLists);
    });
  });

  describe('findOneById', () => {
    it('should return a task list by ID', async () => {
      const taskId = '1';
      const taskList: TaskListEntity = { id: taskId, name: 'Task List 1' };

      const findOneMock = jest.fn();
      taskListRepository.findOne = findOneMock;
      findOneMock.mockResolvedValue(taskList);

      const result = await taskListService.findOneById(taskId);

      expect(result).toEqual(taskList);
      expect(findOneMock).toHaveBeenCalledWith({ where :{ id: taskId } });
    });

    it('should throw NotFoundException if task list is not found', async () => {
      const taskId = '1';

      const findOneMock = jest.fn();
      taskListRepository.findOne = findOneMock;
      findOneMock.mockResolvedValue(null);

      try {
        await taskListService.findOneById(taskId);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
