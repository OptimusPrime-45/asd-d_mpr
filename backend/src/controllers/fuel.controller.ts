import type { Request, Response, NextFunction } from 'express';
import { FuelService } from '../services/fuel.service.js';

const fuelService = new FuelService();

export class FuelController {
  async recordFuelLog(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const log = await fuelService.recordFuelLog(companyId, req.body);
      res.status(201).json({
        success: true,
        message: 'Fuel log recorded successfully',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOperationalCost(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { reg_no } = req.params;
      const costData = await fuelService.getOperationalCost(companyId, reg_no as string);
      res.status(200).json({
        success: true,
        message: 'Operational cost calculated successfully',
        data: costData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFuelLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const logs = await fuelService.getFuelLogs(companyId);
      res.status(200).json({
        success: true,
        message: 'Fuel logs fetched successfully',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}
