import { IsNumber, IsString } from "class-validator";

export class VerifyDto {
    @IsNumber()
    id: number

    @IsString()
    login: string;
}