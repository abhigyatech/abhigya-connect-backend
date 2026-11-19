import { IsOptional, IsString, Length, Matches } from 'class-validator';

const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Full name must be a string.' })
  @Length(2, 60, { message: 'Full name must be between 2 and 60 characters.' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Mobile number must be a string.' })
  @Matches(INDIAN_MOBILE_REGEX, { message: 'Please provide a valid Indian mobile number.' })
  mobileNumber?: string;

  @IsOptional()
  @IsString({ message: 'Current password must be a string.' })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: 'New password must be a string.' })
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'New password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.',
  })
  newPassword?: string;
}
