import { Router } from 'express';
import { FuelController } from '../controllers/fuel.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { permissionMiddleware } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { fuelLogSchema } from '../schemas/fuel.schema.js';

const router = Router();
const fuelController = new FuelController();

// Require authentication for all fuel routes
router.use(authMiddleware);

// POST /api/v1/fuel - Record a new fuel log
router.post(
  '/',
  permissionMiddleware('FUEL_EXPENSE', 'WRITE'),
  validate(fuelLogSchema),
  fuelController.recordFuelLog
);

// GET /api/v1/fuel/:reg_no/operational-cost - Get computed total operational cost
router.get(
  '/:reg_no/operational-cost',
  permissionMiddleware('FUEL_EXPENSE', 'READ'),
  fuelController.getOperationalCost
);

// GET /api/v1/fuel - Get all fuel logs for company
router.get('/', permissionMiddleware('FUEL_EXPENSE', 'READ'), fuelController.getFuelLogs);

export default router;
