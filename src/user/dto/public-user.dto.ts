import { IsInt, IsOptional, IsString } from "class-validator";

export class PublicUserDto {
    @IsInt()
    id: number;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    middleName?: string;
}