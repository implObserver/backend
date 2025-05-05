import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/login.dto'; // DTO для логина
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const { login, password } = registerDto;
    const user = await this.authService.validateUser(login, password);
    if(!user)
    return this.authService.register(registerDto, res);
  }
  
  // Метод для входа
  @Post('login')
  async login(@Body() loginDto: CreateAuthDto, @Res() res: Response) {
    const { login, password } = loginDto;

    // Используем AuthService для валидации пользователя и генерации токена
    const user = await this.authService.validateUser(login, password);
    return this.authService.login(user, res);  // Возвращаем токен в cookie
  }

  // Метод для логаута (удаляем cookie с токеном)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token'); // Очищаем cookie с токеном
    return res.send({ message: 'Logged out successfully' }); // Отправляем успешный ответ
  }
}