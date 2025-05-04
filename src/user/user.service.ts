import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/PaginationDto';
import { DataResponse, PaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PublicUserDto } from './dto/public-user.dto';
import { mapUserToPublicUserDto } from 'src/common/mappers/user.mapper';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  create(createUserDto: CreateUserDto) {
    const { firstName, lastName, middleName, login, password } = createUserDto;

    return this.prisma.user.create({
      data: {
        firstName,
        lastName,
        middleName,
        login,
        password,
        refreshToken: '', // если в модели нет @default
      },
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<PublicUserDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    const mappedUsers = users.map((user) =>
      mapUserToPublicUserDto(user),
    );

    return {
      data: mappedUsers,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<DataResponse<PublicUserDto>> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id
      },
    })

    const mappedUser = mapUserToPublicUserDto(user as User);

    return {
      data: mappedUser,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: Partial<UpdateUserDto> = {};

    if (updateUserDto.firstName) data.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) data.lastName = updateUserDto.lastName;
    if (updateUserDto.password) data.password = updateUserDto.password;
    if (updateUserDto.middleName) data.middleName = updateUserDto.middleName;

    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
