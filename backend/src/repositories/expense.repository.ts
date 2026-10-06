import { prisma } from '../config/prisma.js';
import type { Prisma, Expenses } from '@prisma/client';

export class ExpenseRepository {
  async create(data: Prisma.ExpensesUncheckedCreateInput): Promise<Expenses> {
    return prisma.expenses.create({ data });
  }

  async findByCompany(companyId: number) {
    return prisma.expenses.findMany({
      where: {
        vehicle: {
          company_id: companyId,
        },
      },
      include: {
        trip: true,
      },
      orderBy: {
        trip_id: 'desc',
      },
    });
  }
}
