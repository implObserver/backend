import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicTaskDto } from './dto/public-task.dto';
import { PaginationDto } from 'src/common/dto/PaginationDto';
import { DataResponse, DeadlineFilter, PaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { mapTaskToPublicTaskDto, TaskWithUsers } from 'src/common/mappers/task.mapper';
import { startOfDay, endOfDay, addDays } from 'date-fns';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createTaskDto: CreateTaskDto) {
    const {
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId,
      assigneeId,
    } = createTaskDto;

    return this.prisma.task.create({
      data: {
        title,
        description: description ?? "", // если description может быть undefined
        dueDate: new Date(dueDate), // преобразуем строку в Date
        priority,
        status,
        creator: { connect: { id: creatorId } },
        assignee: { connect: { id: assigneeId } },
      },
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<PublicTaskDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.task.count(),
    ]);

    const tasksWithUsers = tasks as TaskWithUsers[];
    const mappedTasks = tasksWithUsers.map((task) =>
      mapTaskToPublicTaskDto(task)
    );

    return {
      data: mappedTasks,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findGroupedByDeadline(
    filter: DeadlineFilter,
    paginationDto: PaginationDto
  ): Promise<PaginationResponse<PublicTaskDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfDay(addDays(now, 7));

    let whereCondition;

    if (filter === 'today') {
      whereCondition = {
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      };
    } else if (filter === 'week') {
      whereCondition = {
        dueDate: {
          gt: todayEnd,
          lte: weekEnd,
        },
      };
    } else if (filter === 'future') {
      whereCondition = {
        dueDate: {
          gt: weekEnd,
        },
      };
    } else {
      throw new Error(`Invalid filter: ${filter}`);
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.task.count({ where: whereCondition }),
    ]);

    const tasksWithUsers = tasks as TaskWithUsers[];
    const mappedTasks = tasksWithUsers.map(mapTaskToPublicTaskDto);

    return {
      data: mappedTasks,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findGroupedBySubordinates(managerId: number): Promise<Record<string, PublicTaskDto[]>> {
    const subordinates = await this.prisma.user.findMany({
      where: {
        managerId,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const subordinateIds = subordinates.map(u => u.id);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: { in: subordinateIds },
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const tasksWithUsers = tasks as TaskWithUsers[];
    const mapped = tasksWithUsers.map(mapTaskToPublicTaskDto);

    const grouped: Record<string, PublicTaskDto[]> = {};

    for (const user of subordinates) {
      const key = `${user.firstName} ${user.lastName}`;
      grouped[key] = mapped.filter(task => task.assignee.id === user.id);
    }

    return grouped;
  }

  async findTasksByUserId(
    userId: number,
    paginationDto: PaginationDto
  ): Promise<PaginationResponse<PublicTaskDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { assigneeId: userId },
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.task.count({ where: { assigneeId: userId } }),
    ]);

    const mapped = (tasks as TaskWithUsers[]).map(mapTaskToPublicTaskDto);

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<DataResponse<PublicTaskDto>> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: id
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const taskWithUsers = task as TaskWithUsers;
    const mappedTask = mapTaskToPublicTaskDto(taskWithUsers);

    return {
      data: mappedTask,
    };
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const data: Partial<UpdateTaskDto> = {};

    if (updateTaskDto.title) data.title = updateTaskDto.title;
    if (updateTaskDto.description) data.description = updateTaskDto.description;
    if (updateTaskDto.dueDate) data.dueDate = new Date(updateTaskDto.dueDate).toString();
    if (updateTaskDto.status) data.status = updateTaskDto.status;
    if (updateTaskDto.priority) data.priority = updateTaskDto.priority;
    if (updateTaskDto.assigneeId) data.assigneeId = updateTaskDto.assigneeId;

    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.task.delete({ where: { id } });
  }
}
