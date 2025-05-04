import { Priority, Status } from '@prisma/client'; // Пример импорта Enum из Prisma

export class PublicTaskDto {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    priority: Priority;
    creatorId: number;
    creator: UserIncludeDto;
    assigneeId: number;
    assignee: UserIncludeDto;
    status: Status;
}

class UserIncludeDto {
    id: number;
    firstName: string;
    lastName: string;
}