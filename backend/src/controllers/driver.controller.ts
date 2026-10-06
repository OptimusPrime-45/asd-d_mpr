import type { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service.js';

const driverService = new DriverService();

export class DriverController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await driverService.findAllDrivers();
      res.status(200).json({
        success: true,
        message: 'Drivers retrieved successfully',
        data: drivers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = parseInt(req.params.driverId as string, 10);
      const driver = await driverService.findDriverById(driverId);
      res.status(200).json({
        success: true,
        message: 'Driver retrieved successfully',
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) throw new Error('Unauthorized');
      
      const driver = await driverService.createDriver(req.body, companyId);
      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = parseInt(req.params.driverId as string, 10);
      const driver = await driverService.updateDriver(driverId, req.body);
      res.status(200).json({
        success: true,
        message: 'Driver updated successfully',
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = parseInt(req.params.driverId as string, 10);
      await driverService.deleteDriver(driverId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
