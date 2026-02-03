import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: any) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      throw err;
    }

    if (!user) {
      throw new Error('Unauthorized');
    }

    return user;
  }
} 