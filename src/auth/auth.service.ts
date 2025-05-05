import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Для хэширования паролей
import { UserService } from 'src/user/user.service';
import { CreateAuthDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { mapUserToVerifyUserDto } from 'src/common/mappers/verify.mapper';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto, res: Response) {
    const newUser = await this.userService.create(dto);
    return this.login(newUser, res); // сразу логин после регистрации
  }
  
  // Метод для валидации пользователя (используется в LocalStrategy)
  async validateUser(login: string, password: string): Promise<VerifyDto> {
    const user = await this.userService.findOneByLogin(login);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Проверяем совпадение паролей
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const result =mapUserToVerifyUserDto(user);
    // Возвращаем пользователя без пароля
    return result;
  }

  // Метод для входа (генерация JWT и установка в cookie)
  async login(user: VerifyDto, res: Response) {
    const payload = { login: user.login, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
  
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });
  
    return { message: 'Login successful' };
  }
}
