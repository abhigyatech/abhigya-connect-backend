import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;

export class CreateUserDto {
  @IsString({ message: 'Full name must be a string.' })
  @IsNotEmpty({ message: 'Full name is required.' })
  @Length(2, 60, { message: 'Full name must be between 2 and 60 characters.' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email: string;

  @IsString({ message: 'Mobile number must be a string.' })
  @IsNotEmpty({ message: 'Mobile number is required.' })
  @Matches(INDIAN_MOBILE_REGEX, { message: 'Please provide a valid Indian mobile number.' })
  mobileNumber: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.',
  })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be either SUPERADMIN or CLIENT.' })
  role?: Role;

  @IsOptional()
  isVerified?: boolean;
}
