import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: "${options.subject}"`);
  } catch (error) {
    logger.error('Failed to send email', error);
    // Non-fatal — don't crash the request if email fails
  }
};

// ─── Email Templates ───────────────────────────────────────────────────────

export const inviteEmailHtml = (
  name: string,
  email: string,
  tempPassword: string,
  loginUrl: string
): string => `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h2>Welcome to FleetOps, ${name}!</h2>
  <p>Your account has been created. Use the credentials below to log in.</p>
  <table style="border-collapse: collapse; width: 100%;">
    <tr>
      <td style="padding: 8px; font-weight: bold;">Email</td>
      <td style="padding: 8px;">${email}</td>
    </tr>
    <tr style="background: #f5f5f5;">
      <td style="padding: 8px; font-weight: bold;">Temporary Password</td>
      <td style="padding: 8px; font-family: monospace;">${tempPassword}</td>
    </tr>
  </table>
  <p style="margin-top: 24px;">
    <a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
      Login to FleetOps
    </a>
  </p>
  <p style="color:#888; font-size: 12px;">Please keep your credentials safe.</p>
</div>
`;

export const resetPasswordEmailHtml = (resetUrl: string): string => `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h2>Reset Your FleetOps Password</h2>
  <p>We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
  <p style="margin-top: 24px;">
    <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
      Reset Password
    </a>
  </p>
  <p style="color:#888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
</div>
`;
