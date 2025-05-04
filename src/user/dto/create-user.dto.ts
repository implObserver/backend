import { IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsString()
    login: string;

    @IsString()
    password: string;
}