import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/hash.js';
import { sendEmail, inviteEmailHtml } from '../utils/mailer.js';
import { env } from '../config/env.js';
import { ConflictError, BadRequestError } from '../errors/index.js';

/** Generates a random alphanumeric temp password */
const generateTempPassword = (): string => {
  return crypto.randomBytes(6).toString('hex'); // 12 hex chars
};

export const companyService = {
  inviteUser: async (companyId: number, data: { name: string; email: string; roleId: number }) => {
    // Validate roleId exists
    const role = await prisma.roles.findUnique({ where: { id: data.roleId } });
    if (!role) {
      throw new BadRequestError(`Role with ID ${data.roleId} does not exist`);
    }

    // Check email not already taken
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    // Generate and hash temp password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create user scoped to the inviting admin's company
    const user = await userRepository.create({
      company_id: companyId,
      role_id: data.roleId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    // Send invite email (non-fatal if it fails)
    await sendEmail({
      to: data.email,
      subject: `You've been invited to FleetOps`,
      html: inviteEmailHtml(data.name, data.email, tempPassword, `${env.APP_URL}/login`),
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.role,
      company_id: user.company_id,
    };
  },

  listUsers: async (companyId: number) => {
    return userRepository.findByCompany(companyId);
  },

  getCompanySettings: async (companyId: number) => {
    return prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        currency: true,
        distance_unit: true,
      },
    });
  },

  updateCompanySettings: async (
    companyId: number,
    data: { name: string; currency: string; distance_unit: string }
  ) => {
    return prisma.companies.update({
      where: { id: companyId },
      data: {
        name: data.name,
        currency: data.currency,
        distance_unit: data.distance_unit,
      },
      select: {
        id: true,
        name: true,
        currency: true,
        distance_unit: true,
      },
    });
  },
};
