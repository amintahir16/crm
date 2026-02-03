import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class RoleValidationMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to lead assignment endpoints
    if (req.path.includes('/leads') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        const user = (req as any).user;
        if (!user) {
          throw new BadRequestException('User not authenticated');
        }

        // Check if user is trying to assign leads
        const body = req.body;
        if (body.assignedToUserId) {
          // Validate that the assigned user is a sales person or sales manager
          const assignedUser = await this.userRepository.findOne({
            where: { id: body.assignedToUserId }
          });

          if (!assignedUser) {
            throw new BadRequestException('Assigned user not found');
          }

          if (!['sales_person', 'sales_manager'].includes(assignedUser.role)) {
            throw new BadRequestException(
              `Cannot assign leads to user with role: ${assignedUser.role}. Only sales_person and sales_manager can be assigned leads.`
            );
          }

          // Check if the current user has permission to assign leads
          if (!['admin', 'sales_manager'].includes(user.role)) {
            throw new BadRequestException(
              `User with role ${user.role} cannot assign leads. Only admin and sales_manager can assign leads.`
            );
          }

          // Log the assignment for audit purposes
          console.log(`Lead assignment: ${user.fullName} (${user.role}) assigned lead to ${assignedUser.fullName} (${assignedUser.role})`);
        }

        next();
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    } else {
      next();
    }
  }
}
