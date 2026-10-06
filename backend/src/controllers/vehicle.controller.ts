import type { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicle.service.js';

const vehicleService = new VehicleService();

export class VehicleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = await vehicleService.findAllVehicles();
      res.status(200).json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: vehicles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { regNo } = req.params;
      const vehicle = await vehicleService.findVehicleByRegNo(regNo as string);
      res.status(200).json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        ...req.body,
        company_id: req.user?.companyId,
      };
      const vehicle = await vehicleService.createVehicle(payload);
      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { regNo } = req.params;
      const vehicle = await vehicleService.updateVehicle(regNo as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { regNo } = req.params;
      await vehicleService.deleteVehicle(regNo as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
