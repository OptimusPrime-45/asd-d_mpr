import { Router, type Router as ExpressRouter } from 'express';
import { VehicleController } from '../controllers/vehicle.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { permissionMiddleware } from '../middleware/authorize.middleware.js';
import { CreateVehicleSchema, UpdateVehicleSchema } from '../validators/vehicle.validator.js';

const router: ExpressRouter = Router();
const controller = new VehicleController();

router.use(authMiddleware);

router.get('/', permissionMiddleware('FLEET', 'READ'), controller.getAll);
router.get('/:regNo', permissionMiddleware('FLEET', 'READ'), controller.getOne);
router.post(
  '/',
  permissionMiddleware('FLEET', 'WRITE'),
  validate(CreateVehicleSchema),
  controller.create
);
router.patch(
  '/:regNo',
  permissionMiddleware('FLEET', 'WRITE'),
  validate(UpdateVehicleSchema),
  controller.update
);
router.delete('/:regNo', permissionMiddleware('FLEET', 'WRITE'), controller.remove);

export default router;
