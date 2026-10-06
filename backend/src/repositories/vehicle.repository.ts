import { prisma } from '../config/prisma.js';
import type { Prisma, Vehicles } from '@prisma/client';

export class VehicleRepository {
  async findAll(): Promise<Vehicles[]> {
    return prisma.vehicles.findMany();
  }

  async findByRegistrationNumber(reg_no: string): Promise<Vehicles | null> {
    return prisma.vehicles.findUnique({ where: { reg_no } });
  }

  async create(data: Prisma.VehiclesCreateInput): Promise<Vehicles> {
    return prisma.vehicles.create({ data });
  }

  async update(reg_no: string, data: Prisma.VehiclesUpdateInput): Promise<Vehicles> {
    return prisma.vehicles.update({
      where: { reg_no },
      data,
    });
  }

  async delete(reg_no: string): Promise<Vehicles> {
    return prisma.vehicles.delete({
      where: { reg_no },
    });
  }
}
