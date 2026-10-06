import { Router, type Router as ExpressRouter } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router: ExpressRouter = Router();
const controller = new AnalyticsController();

// POST /api/v1/analytics/:companyId
router.post('/:companyId', controller.getAnalytics);

export default router;
