import { Controller, Post, Get, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

class RegisterDto {
  @IsEmail() email: string;
  @IsString() name: string;
  @IsString() @MinLength(6) password: string;
}

class CreateApiKeyDto {
  @IsString() name: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'تسجيل الدخول' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'إنشاء حساب جديد (للأدمن فقط)' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.name, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@Request() req) {
    return req.user;
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء API Key للـ VS Code Extension' })
  async createApiKey(@Request() req, @Body() dto: CreateApiKeyDto) {
    return this.authService.createApiKey(req.user.id, dto.name);
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listApiKeys(@Request() req) {
    return this.authService.listApiKeys(req.user.id);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    await this.authService.revokeApiKey(id, req.user.id);
    return { message: 'تم إلغاء تفعيل المفتاح' };
  }

  // Admin endpoints
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'قائمة المبرمجين (أدمن)' })
  async getUsers() {
    return this.authService.getUsers();
  }

  @Patch('users/:id/limit')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async updateLimit(@Param('id') id: string, @Body('limit') limit: number) {
    await this.authService.updateUserLimit(id, limit);
    return { message: 'تم تحديث الحد' };
  }

  @Patch('users/:id/toggle')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async toggleUser(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    await this.authService.toggleUser(id, isActive);
    return { message: 'تم تحديث حالة المستخدم' };
  }
}
