import { User } from "@prisma/client";
import { VerifyDto } from "src/auth/dto/verify.dto";

export const mapUserToVerifyUserDto = (user: User): VerifyDto => {
    return {
        id: user.id,
        login: user.login,
    };
}