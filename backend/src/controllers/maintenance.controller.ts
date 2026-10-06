import type { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/maintenance.service.js';

const maintenanceService = new MaintenanceService();

export class MaintenanceController {
  async recordMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const maintenance = await maintenanceService.recordMaintenance(companyId, req.body);
      res.status(201).json({
        success: true,
        message: 'Maintenance record created successfully',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveByVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const regNo = req.params.regNo as string;
      const maintenance = await maintenanceService.getActiveMaintenance(companyId, regNo);
      res.status(200).json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const maintenance = await maintenanceService.updateMaintenance(companyId, parseInt(id, 10), req.body);
      res.status(200).json({
        success: true,
        message: 'Maintenance record updated',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }
}
