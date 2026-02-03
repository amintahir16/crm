import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequireRoles } from '../auth/roles.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { User, UserRole } from './user.entity';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.CREATE_USERS)
  async createUser(
    @Body() createUserDto: {
      username: string;
      email: string;
      password: string;
      fullName: string;
      role: UserRole;
      phone?: string;
      isActive?: boolean;
    },
  ): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.SALES_MANAGER)
  @RequirePermissions(Permission.VIEW_USERS)
  async getAllUsers(@Query('role') role?: UserRole): Promise<User[]> {
    if (role) {
      return this.usersService.getUsersByRole(role);
    }
    return this.usersService.getAllUsers();
  }

  @Get('search')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.VIEW_USERS)
  async searchUsers(@Query('q') searchTerm: string): Promise<User[]> {
    return this.usersService.searchUsers(searchTerm);
  }

  @Get('role/:role')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.SALES_MANAGER)
  @RequirePermissions(Permission.VIEW_USERS)
  async getUsersByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.usersService.getUsersByRole(role);
  }

  @Get('stats')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: number;
  }> {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.VIEW_USERS)
  async getUserById(@Param('id', ParseUUIDPipe) userId: string): Promise<User> {
    return this.usersService.getUserById(userId);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.EDIT_USERS)
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: Partial<{
      username: string;
      email: string;
      fullName: string;
      role: UserRole;
      phone: string;
      isActive: boolean;
    }>,
  ): Promise<User> {
    return this.usersService.updateUser(userId, updateUserDto);
  }

  @Put(':id/change-password')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.EDIT_USERS)
  async changePassword(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() changePasswordDto: {
      currentPassword: string;
      newPassword: string;
    },
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Put(':id/reset-password')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.EDIT_USERS)
  async resetPassword(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() resetPasswordDto: {
      newPassword: string;
    },
  ): Promise<{ message: string }> {
    return this.usersService.resetPassword(userId, resetPasswordDto.newPassword);
  }

  @Put(':id/activate')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.EDIT_USERS)
  async activateUser(@Param('id', ParseUUIDPipe) userId: string): Promise<{ message: string }> {
    return this.usersService.activateUser(userId);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @RequirePermissions(Permission.DELETE_USERS)
  async deleteUser(@Param('id', ParseUUIDPipe) userId: string): Promise<{ message: string }> {
    return this.usersService.deleteUser(userId);
  }
}