import { Router, type Router as ExpressRouter } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTripStatus,
  getRecentTrips,
} from '../controllers/trip.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { permissionMiddleware } from '../middleware/authorize.middleware.js';

const router: ExpressRouter = Router();

router.use(authMiddleware);

router.get('/recent/:companyId', permissionMiddleware('TRIPS', 'READ'), getRecentTrips);
router.get('/', permissionMiddleware('TRIPS', 'READ'), getTrips);
router.get('/:id', permissionMiddleware('TRIPS', 'READ'), getTripById);
router.post('/', permissionMiddleware('TRIPS', 'WRITE'), createTrip);
router.put('/:id/status', permissionMiddleware('TRIPS', 'WRITE'), updateTripStatus);

export default router;
