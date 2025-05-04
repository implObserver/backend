import { Task, User } from "@prisma/client";
import { PublicTaskDto } from "src/task/dto/public-task.dto";

export interface TaskWithUsers extends Task {
    creator: User;
    assignee: User; // assignee может быть null
}

export const mapTaskToPublicTaskDto = (task: TaskWithUsers): PublicTaskDto => {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate.toISOString(), // или другой формат
        priority: task.priority,
        creatorId: task.creatorId,
        creator: {
            id: task.creatorId,
            firstName: task.creator.firstName,
            lastName: task.creator.lastName,
        },
        assigneeId: task.assigneeId,
        assignee: {
            id: task.assignee.id,
            firstName: task.assignee.firstName,
            lastName: task.assignee.lastName,
        },
        status: task.status,
    };
}