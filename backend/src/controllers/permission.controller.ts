import type { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service.js';

const permissionService = new PermissionService();

export class PermissionController {
  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const perms = await permissionService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: perms,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { matrix } = req.body;
      if (!Array.isArray(matrix)) {
        return res.status(400).json({
          success: false,
          message: 'Matrix must be an array of permissions objects',
        });
      }
      await permissionService.updatePermissions(matrix);
      res.status(200).json({
        success: true,
        message: 'Permissions updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
