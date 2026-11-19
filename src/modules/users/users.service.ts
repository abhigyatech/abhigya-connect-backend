import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const dataToUpdate: {
      fullName?: string;
      mobileNumber?: string;
      password?: string;
    } = {};

    if (dto.fullName) {
      dataToUpdate.fullName = dto.fullName.trim();
    }

    if (dto.mobileNumber) {
      dataToUpdate.mobileNumber = dto.mobileNumber.replace(/[\s-]/g, '').slice(-10);
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password.');
      }
      if (!user.password || !verifyPassword(dto.currentPassword, user.password)) {
        throw new BadRequestException('Incorrect current password.');
      }
      dataToUpdate.password = hashPassword(dto.newPassword);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('A user with this email address already exists.');
    }

    const created = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        mobileNumber: dto.mobileNumber.replace(/[\s-]/g, '').slice(-10),
        password: hashPassword(dto.password),
        role: dto.role || Role.CLIENT,
        isVerified: dto.isVerified ?? true,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return created;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const dataToUpdate: {
      fullName?: string;
      email?: string;
      mobileNumber?: string;
      password?: string;
      role?: Role;
      isVerified?: boolean;
      isActive?: boolean;
    } = {};

    if (dto.fullName) {
      dataToUpdate.fullName = dto.fullName.trim();
    }

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      if (email !== user.email) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
          throw new ConflictException('This email is already taken by another account.');
        }
        dataToUpdate.email = email;
      }
    }

    if (dto.mobileNumber) {
      dataToUpdate.mobileNumber = dto.mobileNumber.replace(/[\s-]/g, '').slice(-10);
    }

    if (dto.password) {
      dataToUpdate.password = hashPassword(dto.password);
    }

    if (dto.role) {
      dataToUpdate.role = dto.role;
    }

    if (typeof dto.isVerified === 'boolean') {
      dataToUpdate.isVerified = dto.isVerified;
    }

    if (typeof dto.isActive === 'boolean') {
      dataToUpdate.isActive = dto.isActive;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async toggleUserStatus(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('You cannot deactivate your own administrative account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return updated;
  }

  async deleteUser(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('You cannot delete your own administrative account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.otp.deleteMany({
      where: {
        OR: [{ userId: id }, { email: user.email }],
      },
    });

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User account has been deleted permanently.',
      id,
    };
  }

  async getPlatformStats() {
    const [totalUsers, totalClients, totalSuperadmins, verifiedUsers, activeUsers, deactivatedUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.CLIENT } }),
        this.prisma.user.count({ where: { role: Role.SUPERADMIN } }),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
      ]);

    return {
      totalUsers,
      totalClients,
      totalSuperadmins,
      verifiedUsers,
      activeUsers,
      deactivatedUsers,
    };
  }
}
