import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';
import { Permission, hasPermission } from './permissions.guard';

// Combined decorator for roles and permissions
export const RequireRoleOrPermission = (roles: UserRole[], permissions: Permission[]) => 
  SetMetadata('rolePermissionConfig', { roles, permissions });

// Decorator for CRM access (sales person with CRM permissions or admin)
export const CRMAccess = (permissions: Permission[]) => 
  RequireRoleOrPermission([UserRole.ADMIN, UserRole.SALES_PERSON], permissions);

@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.getAllAndOverride<{roles: UserRole[], permissions: Permission[]}>('rolePermissionConfig', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!config) {
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

    // Check if user has required role
    const hasRequiredRole = config.roles.includes(user.role);
    if (!hasRequiredRole) {
      return false;
    }

    // Check if user has required permissions
    const hasRequiredPermissions = config.permissions.every(permission => 
      hasPermission(user.role, permission)
    );

    return hasRequiredPermissions;
  }
}
