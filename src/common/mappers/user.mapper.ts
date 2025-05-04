import { User } from "@prisma/client";
import { PublicUserDto } from "src/user/dto/public-user.dto";

export const mapUserToPublicUserDto = (user: User): PublicUserDto => {
    return {
        id: user.id,
        firstName:user.firstName,
        lastName:user.lastName,
        middleName:user.middleName ?? '',
    };
}