import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId as string, 10);
      if (isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Invalid company ID' });
      }
      const analytics = await analyticsService.getCompanyAnalytics(companyId);
      res.status(200).json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}
