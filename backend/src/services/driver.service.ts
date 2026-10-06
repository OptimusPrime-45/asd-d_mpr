import { prisma } from '../config/prisma.js';
import { DriverRepository } from '../repositories/driver.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import bcrypt from 'bcryptjs';
import type { Prisma, Driver } from '@prisma/client';

const driverRepository = new DriverRepository();

export class DriverService {
  async findAllDrivers(): Promise<any[]> {
    return driverRepository.findAll();
  }

  async findDriverById(driver_id: number): Promise<Driver> {
    const driver = await driverRepository.findById(driver_id);
    if (!driver) {
      throw new NotFoundError(`Driver with ID ${driver_id} not found`);
    }
    return driver;
  }

  async createDriver(data: any, companyId: number): Promise<Driver> {
    // Check if user email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError(`User with email ${data.email} already exists`);
    }

    const driverRole = await prisma.roles.findUnique({
      where: { role: 'DRIVER' },
    });
    if (!driverRole) throw new Error('Driver role not found');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and driver in a transaction
    return prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role_id: driverRole.id,
          company_id: companyId,
        },
      });

      const newDriver = await tx.driver.create({
        data: {
          license_no: data.license_no,
          driver_id: newUser.id,
          status: data.status,
          safety_score: data.safety_score,
          license_type: data.license_type,
          expiry_date: new Date(data.expiry_date),
          contact_number: data.contact_number || '',
          trip_completion_rate: data.trip_completion_rate || 0,
        },
        include: { user: true },
      });

      return newDriver;
    });
  }

  async updateDriver(driver_id: number, data: Prisma.DriverUncheckedUpdateInput): Promise<Driver> {
    await this.findDriverById(driver_id); // check existence
    return driverRepository.update(driver_id, data);
  }

  async deleteDriver(driver_id: number): Promise<void> {
    await this.findDriverById(driver_id); // check existence
    await driverRepository.delete(driver_id);
  }
}
