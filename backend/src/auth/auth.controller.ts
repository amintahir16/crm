import { Controller, Post, Body, Get, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.authService.getProfile(req.user.userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
} 