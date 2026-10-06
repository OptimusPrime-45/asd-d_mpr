import { VehicleRepository } from '../repositories/vehicle.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import type { Prisma, Vehicles } from '@prisma/client';

const vehicleRepository = new VehicleRepository();

export class VehicleService {
  async findAllVehicles(): Promise<Vehicles[]> {
    return vehicleRepository.findAll();
  }

  async findVehicleByRegNo(reg_no: string): Promise<Vehicles> {
    const vehicle = await vehicleRepository.findByRegistrationNumber(reg_no);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with registration number ${reg_no} not found`);
    }
    return vehicle;
  }

  async createVehicle(data: Prisma.VehiclesCreateInput): Promise<Vehicles> {
    const existingVehicle = await vehicleRepository.findByRegistrationNumber(data.reg_no);
    if (existingVehicle) {
      throw new ConflictError(`Vehicle with registration number ${data.reg_no} already exists`);
    }
    return vehicleRepository.create(data);
  }

  async updateVehicle(reg_no: string, data: Prisma.VehiclesUpdateInput): Promise<Vehicles> {
    await this.findVehicleByRegNo(reg_no); // check existence
    return vehicleRepository.update(reg_no, data);
  }

  async deleteVehicle(reg_no: string): Promise<void> {
    await this.findVehicleByRegNo(reg_no); // check existence
    await vehicleRepository.delete(reg_no);
  }
}
