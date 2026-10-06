import { prisma } from '../config/prisma.js';

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.users.findUnique({
      where: { email },
      include: { role: true, company: true },
    });
  },

  findById: async (id: number) => {
    return prisma.users.findUnique({
      where: { id },
      include: { role: true },
    });
  },

  create: async (data: {
    company_id: number;
    role_id: number;
    name: string;
    email: string;
    password: string;
  }) => {
    return prisma.users.create({
      data,
      include: { role: true },
    });
  },

  findByCompany: async (companyId: number) => {
    return prisma.users.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true,
        role: { select: { id: true, role: true } },
      },
    });
  },

  findByResetToken: async (token: string) => {
    return prisma.users.findFirst({
      where: {
        password_reset_token: token,
        password_reset_expires: { gt: new Date() },
      },
    });
  },

  updatePassword: async (id: number, password: string) => {
    return prisma.users.update({
      where: { id },
      data: { password },
    });
  },

  setResetToken: async (id: number, token: string, expires: Date) => {
    return prisma.users.update({
      where: { id },
      data: {
        password_reset_token: token,
        password_reset_expires: expires,
      },
    });
  },

  clearResetToken: async (id: number) => {
    return prisma.users.update({
      where: { id },
      data: {
        password_reset_token: null,
        password_reset_expires: null,
      },
    });
  },
};
