import { Router, type Router as ExpressRouter } from 'express';
import roleRoutes from './role.routes.js';
import tripRoutes from './trip.routes.js';
import kpiRoutes from './kpi.routes.js';
import vehicleRoutes from './vehicle.routes.js';
import driverRoutes from './driver.routes.js';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import fuelRoutes from './fuel.routes.js';
import expenseRoutes from './expense.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import analyticsRoutes from './analytics.routes.js';
import permissionRoutes from './permission.routes.js';
import integrationsRoutes from './integrations.routes.js';

const router: ExpressRouter = Router();

router.use('/roles', roleRoutes);
router.use('/trips', tripRoutes);
router.use('/kpi', kpiRoutes);
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/fuel', fuelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/maintenances', maintenanceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/permissions', permissionRoutes);
router.use('/integrations', integrationsRoutes);

export default router;
