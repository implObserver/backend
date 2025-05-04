import { Priority } from '@prisma/client'; // Пример импорта Enum из Prisma

export class CreateTaskDto {
    title: string;
    description: string;
    dueDate: string;
    priority: Priority;
    creatorId: number;
    assigneeId: number;
}
