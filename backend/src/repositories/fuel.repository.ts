import { prisma } from '../config/prisma.js';
import type { Prisma, Fuel_Logs } from '@prisma/client';

export class FuelRepository {
  async create(data: Prisma.Fuel_LogsUncheckedCreateInput): Promise<Fuel_Logs> {
    return prisma.fuel_Logs.create({ data });
  }

  async sumFuelCostsByVehicle(reg_no: string): Promise<number> {
    const aggregate = await prisma.fuel_Logs.aggregate({
      where: { reg_no },
      _sum: {
        fuel_cost: true,
      },
    });
    return aggregate._sum.fuel_cost || 0;
  }

  async findByCompany(companyId: number): Promise<Fuel_Logs[]> {
    return prisma.fuel_Logs.findMany({
      where: {
        vehicle: {
          company_id: companyId,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
