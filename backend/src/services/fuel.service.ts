import { FuelRepository } from '../repositories/fuel.repository.js';
import { VehicleRepository } from '../repositories/vehicle.repository.js';
import { MaintenanceRepository } from '../repositories/maintenance.repository.js';
import { NotFoundError, ForbiddenError } from '../errors/index.js';
import type { Fuel_Logs } from '@prisma/client';

const fuelRepository = new FuelRepository();
const vehicleRepository = new VehicleRepository();
const maintenanceRepository = new MaintenanceRepository();

export class FuelService {
  async recordFuelLog(
    companyId: number,
    data: { reg_no: string; litres: number; fuel_cost: number; date?: string }
  ): Promise<Fuel_Logs> {
    const vehicle = await vehicleRepository.findByRegistrationNumber(data.reg_no);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with registration number ${data.reg_no} not found`);
    }

    if (vehicle.company_id !== companyId) {
      throw new ForbiddenError('You do not have permission to access this vehicle');
    }

    return fuelRepository.create({
      reg_no: data.reg_no,
      litres: data.litres,
      fuel_cost: data.fuel_cost,
      date: data.date ? new Date(data.date) : new Date(),
    });
  }

  async getOperationalCost(
    companyId: number,
    reg_no: string
  ): Promise<{
    reg_no: string;
    total_fuel_cost: number;
    total_maintenance_cost: number;
    total_operational_cost: number;
  }> {
    const vehicle = await vehicleRepository.findByRegistrationNumber(reg_no);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with registration number ${reg_no} not found`);
    }

    if (vehicle.company_id !== companyId) {
      throw new ForbiddenError('You do not have permission to access this vehicle');
    }

    const [totalFuelCost, totalMaintenanceCost] = await Promise.all([
      fuelRepository.sumFuelCostsByVehicle(reg_no),
      maintenanceRepository.sumMaintenanceCostsByVehicle(reg_no),
    ]);

    return {
      reg_no,
      total_fuel_cost: totalFuelCost,
      total_maintenance_cost: totalMaintenanceCost,
      total_operational_cost: totalFuelCost + totalMaintenanceCost,
    };
  }

  async getFuelLogs(companyId: number): Promise<Fuel_Logs[]> {
    return fuelRepository.findByCompany(companyId);
  }
}
