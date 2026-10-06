import type { Request, Response, NextFunction } from 'express';
import { getFleetKpis, type KpiFilters } from '../services/kpi.service.js';

/**
 * GET /api/v1/kpi
 *
 * Query params (all optional):
 *   - vehicleType  : Filter by vehicle type string (e.g. "Truck", "Van")
 *   - vehicleStatus: Informational filter; reserved for future filtering
 *   - region       : Reserved for future filtering (not in DB schema yet)
 */
export async function getKpiHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = JSON.parse(
      JSON.stringify({
        vehicleType: req.query.vehicleType,
        vehicleStatus: req.query.vehicleStatus,
        region: req.query.region,
      })
    ) as KpiFilters;

    const kpis = await getFleetKpis(filters);

    res.status(200).json({
      success: true,
      data: kpis,
      filters, // echo filters back for transparency
    });
  } catch (error) {
    next(error);
  }
}
