import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.zoho.in';
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 465;
    const secure = this.configService.get<string>('SMTP_SECURE') !== 'false';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  private getEmailWrapper(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 32px 16px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
            <tr>
              <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid #F1F5F9; background: linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                      <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #EA580C 0%, #F59E0B 100%); text-align: center; line-height: 40px; color: #FFFFFF; font-size: 20px; font-weight: 800;">
                        &#9889;
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 19px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em;">Abhigya Connect</div>
                      <div style="font-size: 11px; font-weight: 600; color: #EA580C; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Customer Engagement Platform</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 36px;">
                ${bodyContent}
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 36px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #64748B;">
                  Abhigya Connect &bull; AbhigyaTech Solutions
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                  This is an automated security transmission. If you need assistance, please write to <a href="mailto:support@abhigyatech.in" style="color: #EA580C; text-decoration: none; font-weight: 600;">support@abhigyatech.in</a>.
                </p>
                <p style="margin: 0; font-size: 10px; color: #CBD5E1;">
                  &copy; 2026 AbhigyaTech. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  async sendOtpEmail(email: string, otp: string, fullName?: string): Promise<void> {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Email service is not configured. Unable to send verification code.'
      );
    }

    const displayName = fullName || 'User';
    const from = this.configService.get<string>('SMTP_FROM') || 'Abhigya Connect <noreply@abhigyatech.in>';

    const content = `
      <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em;">
        Account Verification Code
      </h1>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        Hello <strong>${displayName}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Please use the following 6-digit one-time verification code to verify your account and complete your sign-in to Abhigya Connect. This code will expire in <strong>10 minutes</strong>.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; padding: 14px 32px; background-color: #FFF7ED; border: 1.5px solid #FFEDD5; border-radius: 14px; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08);">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #EA580C;">
            ${otp}
          </span>
        </div>
      </div>

      <div style="padding: 14px 18px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748B;">
          <strong style="color: #0F172A;">Security Tip:</strong> Never share this code with anyone. Abhigya Connect personnel will never ask for your verification code.
        </p>
      </div>

      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
        If you did not initiate this request, you can safely disregard this email or contact our security desk immediately.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: `${otp} is your Abhigya Connect verification code`,
        html: this.getEmailWrapper('Verification Code', content),
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to deliver verification email. Please verify SMTP details or try again.'
      );
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, fullName?: string): Promise<void> {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Email service is not configured. Unable to send password reset code.'
      );
    }

    const displayName = fullName || 'User';
    const from = this.configService.get<string>('SMTP_FROM') || 'Abhigya Connect <noreply@abhigyatech.in>';

    const content = `
      <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em;">
        Reset Your Account Password
      </h1>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        Hello <strong>${displayName}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        We received a request to reset your Abhigya Connect account password. Enter the authorization code below in your password reset window to choose a new password. This code expires in <strong>10 minutes</strong>.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; padding: 14px 32px; background-color: #FFF7ED; border: 1.5px solid #FFEDD5; border-radius: 14px; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08);">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #EA580C;">
            ${otp}
          </span>
        </div>
      </div>

      <div style="padding: 14px 18px; background-color: #FFF1F2; border: 1px solid #FFE4E6; border-radius: 12px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9F1239;">
          <strong>Important:</strong> If you did not request a password reset, please change your password immediately or reach out to our team at support@abhigyatech.in.
        </p>
      </div>

      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
        This email was intended for ${email}.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: `${otp} is your Abhigya Connect password reset code`,
        html: this.getEmailWrapper('Password Reset Code', content),
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to deliver password reset email. Please verify SMTP details or try again.'
      );
    }
  }
}
