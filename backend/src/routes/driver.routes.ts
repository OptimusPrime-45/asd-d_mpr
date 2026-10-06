import { Router, type Router as ExpressRouter } from 'express';
import { DriverController } from '../controllers/driver.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { permissionMiddleware } from '../middleware/authorize.middleware.js';
import { CreateDriverSchema, UpdateDriverSchema } from '../validators/driver.validator.js';

const router: ExpressRouter = Router();
const controller = new DriverController();

router.use(authMiddleware);

router.get('/', permissionMiddleware('DRIVERS', 'READ'), controller.getAll);
router.get('/:id', permissionMiddleware('DRIVERS', 'READ'), controller.getOne);
router.post(
  '/',
  permissionMiddleware('DRIVERS', 'WRITE'),
  validate(CreateDriverSchema),
  controller.create
);
router.patch(
  '/:id',
  permissionMiddleware('DRIVERS', 'WRITE'),
  validate(UpdateDriverSchema),
  controller.update
);
router.delete('/:id', permissionMiddleware('DRIVERS', 'WRITE'), controller.remove);

export default router;
