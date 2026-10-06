import { prisma } from '../config/prisma.js';
import type { Prisma, Driver } from '@prisma/client';

export class DriverRepository {
  async findAll(): Promise<any[]> {
    return prisma.driver.findMany({ include: { user: true } });
  }

  async findById(driver_id: number): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { driver_id },
      include: { user: true },
    });
  }

  async create(data: Prisma.DriverUncheckedCreateInput): Promise<Driver> {
    return prisma.driver.create({ data });
  }

  async update(driver_id: number, data: Prisma.DriverUncheckedUpdateInput): Promise<Driver> {
    return prisma.driver.update({
      where: { driver_id },
      data,
    });
  }

  async delete(driver_id: number): Promise<Driver> {
    return prisma.driver.delete({
      where: { driver_id },
    });
  }
}
