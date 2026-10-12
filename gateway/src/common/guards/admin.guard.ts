import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('هذه العملية تتطلب صلاحيات المدير');
    }
    return true;
  }
}
