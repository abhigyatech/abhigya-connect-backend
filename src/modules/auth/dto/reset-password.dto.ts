import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email: string;

  @IsString({ message: 'Verification code must be a string.' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'Verification code must consist of 6 numeric digits.' })
  otp: string;

  @IsString({ message: 'New password must be a string.' })
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'New password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.',
  })
  newPassword: string;
}
