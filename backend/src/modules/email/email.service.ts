import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Config } from '../../config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService<Config>) {
    const apiKey = configService.get('app.resendApiKey', { infer: true }) || '';
    this.fromEmail =
      configService.get('app.resendFromEmail', { infer: true }) ||
      'onboarding@resend.dev';
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
                  <!-- Header -->
                  <tr>
                    <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                        Cognify
                      </h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 12px;color:#111;font-size:20px;font-weight:600;">
                        Verify your email address
                      </h2>
                      <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
                        Use the code below to complete your sign-up. This code expires in <strong>15 minutes</strong>.
                      </p>
                      <!-- OTP Box -->
                      <div style="background:#f4f4f4;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                        <span style="font-size:44px;font-weight:800;letter-spacing:12px;color:#111;font-family:'Courier New',monospace;">
                          ${code}
                        </span>
                      </div>
                      <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
                        If you didn't create a Cognify account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                      <p style="margin:0;color:#aaa;font-size:12px;">
                        © ${new Date().getFullYear()} Cognify. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: `Cognify <${this.fromEmail}>`,
        to,
        subject: `${code} is your Cognify verification code`,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
        throw new Error(`Email delivery failed: ${error.message}`);
      }

      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Email send error: ${err}`);
      throw err;
    }
  }
}
