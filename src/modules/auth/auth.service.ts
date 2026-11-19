import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/database/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const fullName = dto.fullName.trim();
    const mobileNumber = dto.mobileNumber.trim();
    const hashedPassword = hashPassword(dto.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.isVerified) {
      throw new ConflictException('An account with this email already exists. Please log in.');
    }

    let user = existingUser;
    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName,
          mobileNumber,
          password: hashedPassword,
          role: Role.CLIENT,
          isActive: true,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          fullName,
          email,
          mobileNumber,
          password: hashedPassword,
          role: Role.CLIENT,
          isVerified: false,
          isActive: true,
        },
      });
    }

    const otpCode = this.generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    await this.prisma.otp.create({
      data: {
        code: otpCode,
        email,
        userId: user.id,
        expiresAt,
        isUsed: false,
      },
    });

    await this.mailService.sendOtpEmail(email, otpCode, user.fullName);

    return {
      message: 'Verification code sent to your email address.',
      email: user.email,
      role: user.role,
    };
  }

  async loginWithPassword(dto: LoginPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const isMatch = verifyPassword(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account email is not verified yet. Please sign in via OTP verification.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email. Please create an account.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const otpCode = this.generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    await this.prisma.otp.create({
      data: {
        code: otpCode,
        email,
        userId: user.id,
        expiresAt,
        isUsed: false,
      },
    });

    await this.mailService.sendOtpEmail(email, otpCode, user.fullName);

    return {
      message: 'Verification code sent to your email address.',
      email: user.email,
      role: user.role,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const code = dto.otp.trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const validOtp = await this.prisma.otp.findFirst({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    await this.prisma.otp.update({
      where: { id: validOtp.id },
      data: { isUsed: true },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      fullName: updatedUser.fullName,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const otpCode = this.generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    await this.prisma.otp.create({
      data: {
        code: otpCode,
        email,
        userId: user.id,
        expiresAt,
        isUsed: false,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, otpCode, user.fullName);

    return {
      message: 'Password reset code has been sent to your email.',
      email: user.email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const code = dto.otp.trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const validOtp = await this.prisma.otp.findFirst({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired password reset code.');
    }

    await this.prisma.otp.update({
      where: { id: validOtp.id },
      data: { isUsed: true },
    });

    const hashedPassword = hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    return {
      message: 'Your password has been reset successfully. Please log in with your new password.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
