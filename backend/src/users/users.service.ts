import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User, UserRole } from './user.entity';
import { LiveWorkloadService } from './live-workload.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private liveWorkloadService: LiveWorkloadService,
  ) {}

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    phone?: string;
    isActive?: boolean;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: userData.email,
      passwordHash: hashedPassword,
      fullName: userData.fullName,
      role: userData.role,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    });

    return await this.userRepository.save(user);
  }

  async updateUser(
    userId: string,
    updateData: Partial<{
      username: string;
      email: string;
      fullName: string;
      role: UserRole;
      phone: string;
      isActive: boolean;
    }>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for conflicts if username or email is being updated
    if (updateData.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('User with this username or email already exists');
      }
    }

    // Update user
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, { passwordHash: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }

  async resetPassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, { passwordHash: hashedPassword });

    return { message: 'Password reset successfully' };
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersByRole(role: UserRole): Promise<any[]> {
    // Get users without workload score
    const users = await this.userRepository.find({
      where: { role, isActive: true },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt'],
      order: { fullName: 'ASC' },
    });

    // For sales agents, get live workload data
    if (role === UserRole.SALES_PERSON) {
      const usersWithLiveWorkload = await Promise.all(
        users.map(async (user) => {
          try {
            const workloadData = await this.liveWorkloadService.getAgentWorkload(user.id);
            return {
              ...user,
              workloadScore: workloadData.workloadScore
            };
          } catch (error) {
            console.error(`Error calculating workload for user ${user.id}:`, error);
            return {
              ...user,
              workloadScore: 0
            };
          }
        })
      );
      
      return usersWithLiveWorkload;
    }

    return users;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating
    await this.userRepository.update(userId, { isActive: false });

    return { message: 'User deactivated successfully' };
  }

  async activateUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, { isActive: true });

    return { message: 'User activated successfully' };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: number;
  }> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });

    // Users by role
    const usersByRole = {} as Record<UserRole, number>;
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.userRepository.count({ where: { role } });
    }

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await this.userRepository.count({
      where: { createdAt: thirtyDaysAgo },
    });

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers,
    };
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.username ILIKE :searchTerm OR user.email ILIKE :searchTerm OR user.fullName ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .select(['user.id', 'user.username', 'user.email', 'user.fullName', 'user.role', 'user.phone', 'user.isActive', 'user.createdAt', 'user.updatedAt'])
      .orderBy('user.fullName', 'ASC')
      .getMany();
  }
}