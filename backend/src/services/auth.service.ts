import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { sendEmail, resetPasswordEmailHtml } from '../utils/mailer.js';
import { env } from '../config/env.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '../errors/index.js';

export const authService = {
  registerCompany: async (data: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const company = await prisma.companies.create({
      data: { name: data.companyName },
    });

    const adminRole = await prisma.roles.findUnique({ where: { role: 'ADMIN' } });
    if (!adminRole) {
      throw new BadRequestError('ADMIN role not found. Please run: pnpm prisma db seed');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await userRepository.create({
      company_id: company.id,
      role_id: adminRole.id,
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    const token = signToken({
      userId: user.id,
      companyId: company.id,
      role: user.role.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.role,
        companyId: company.id,
      },
    };
  },

  login: async (data: { email: string; password: string }) => {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(data.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.role,
        companyId: user.company_id,
      },
    };
  },

  forgotPassword: async (email: string) => {
    const user = await userRepository.findByEmail(email);

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await userRepository.setResetToken(user.id, token, expires);

      const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your FleetOps password',
        html: resetPasswordEmailHtml(resetUrl),
      });
    }

    // Always return success — no email enumeration
    return {
      message: 'If an account with that email exists, a reset link has been sent.',
    };
  },

  resetPassword: async (token: string, newPassword: string) => {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired');
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, hashedPassword);
    await userRepository.clearResetToken(user.id);

    return { message: 'Password has been reset successfully' };
  },
};
