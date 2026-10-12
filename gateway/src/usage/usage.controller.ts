import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage')
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('me')
  myStats(@Request() req) {
    return this.usageService.getUserStats(req.user.id);
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  adminStats() {
    return this.usageService.getAdminStats();
  }
}
