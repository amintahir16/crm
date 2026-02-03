import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';

// Decorator for setting required roles
export const RequireRoles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Decorator for admin-only access
export const AdminOnly = () => RequireRoles(UserRole.ADMIN);

// Decorator for sales team access (sales manager + sales person + admin)
export const SalesTeamAccess = () => RequireRoles(UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON);

// Decorator for sales manager access only
export const SalesManagerAccess = () => RequireRoles(UserRole.ADMIN, UserRole.SALES_MANAGER);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Admin has access to everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
