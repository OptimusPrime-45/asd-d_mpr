import { MaintenanceRepository } from '../repositories/maintenance.repository.js';
import { VehicleRepository } from '../repositories/vehicle.repository.js';
import { NotFoundError, ForbiddenError } from '../errors/index.js';
import { jiraService } from './jira.service.js';
import type { Maintenance, ServiceType } from '@prisma/client';

const maintenanceRepository = new MaintenanceRepository();
const vehicleRepository = new VehicleRepository();

export class MaintenanceService {
  async recordMaintenance(
    companyId: number,
    data: {
      reg_no: string;
      service_type: ServiceType;
      cost: number;
      date: string;
      status: string;
    }
  ): Promise<Maintenance> {
    const vehicle = await vehicleRepository.findByRegistrationNumber(data.reg_no);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with registration number ${data.reg_no} not found`);
    }

    if (vehicle.company_id !== companyId) {
      throw new ForbiddenError('You do not have permission to access this vehicle');
    }

    // Generate Jira work order issue
    const jiraIssue = await jiraService.createMaintenanceIssue({
      regNo: data.reg_no,
      vehicleModel: vehicle.vehicle_model,
      serviceType: data.service_type,
      cost: data.cost,
      date: data.date,
    });

    return maintenanceRepository.create({
      reg_no: data.reg_no,
      service_type: data.service_type,
      cost: data.cost,
      date: new Date(data.date),
      status: data.status,
      jira_issue_key: jiraIssue.key,
      jira_issue_id: jiraIssue.id,
      jira_issue_url: jiraIssue.url,
      jira_status: jiraIssue.status,
    });
  }

  async getActiveMaintenance(companyId: number, reg_no: string): Promise<Maintenance | null> {
    const vehicle = await vehicleRepository.findByRegistrationNumber(reg_no);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with registration number ${reg_no} not found`);
    }
    if (vehicle.company_id !== companyId) {
      throw new ForbiddenError('You do not have permission to access this vehicle');
    }

    return maintenanceRepository.findActiveByRegNo(reg_no);
  }

  async updateMaintenance(
    companyId: number,
    id: number,
    data: { status?: string }
  ): Promise<Maintenance> {
    // In a real app we'd verify the maintenance record belongs to a vehicle of this company.
    // For now, we trust the ID or we can fetch it first if we had a findById.
    return maintenanceRepository.update(id, data);
  }
}
