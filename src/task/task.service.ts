import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicTaskDto } from './dto/public-task.dto';
import { PaginationDto } from 'src/common/dto/PaginationDto';
import { DataResponse, PaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { mapTaskToPublicTaskDto, TaskWithUsers } from 'src/common/mappers/task.mapper';

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
