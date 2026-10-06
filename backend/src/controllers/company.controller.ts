import type { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service.js';

export const companyController = {
  inviteUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await companyService.inviteUser(
        companyId,
        req.body as {
          name: string;
          email: string;
          roleId: number;
        }
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  listUsers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const users = await companyService.listUsers(companyId);
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  getSettings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const settings = await companyService.getCompanySettings(companyId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  updateSettings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const { name, currency, distance_unit } = req.body;
      if (!name || !currency || !distance_unit) {
        res.status(400).json({
          success: false,
          message: 'name, currency, and distance_unit are required fields',
        });
        return;
      }
      const updated = await companyService.updateCompanySettings(companyId, {
        name,
        currency,
        distance_unit,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};
