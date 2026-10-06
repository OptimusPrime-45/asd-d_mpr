import { Router, type Router as ExpressRouter } from 'express';
import { getKpiHandler } from '../controllers/kpi.controller.js';

const router: ExpressRouter = Router();

/**
 * GET /api/v1/kpi
 *
 * Returns fleet KPIs with optional filters.
 *
 * Query params:
 *   vehicleType   - Filter by vehicle type (e.g. "Truck", "Van")
 *   vehicleStatus - Reserved (not yet active)
 *   region        - Reserved (not yet active)
 */
router.get('/', getKpiHandler);

export default router;
