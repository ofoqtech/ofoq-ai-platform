import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    // Support both JWT Bearer and API Key auth
    if (apiKey) {
      const user = await this.authService.validateApiKey(apiKey);
      if (!user) throw new UnauthorizedException('API Key غير صالح');
      request.user = user;
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
