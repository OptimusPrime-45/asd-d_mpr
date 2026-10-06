import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { inviteUserSchema } from '../schemas/company.schema.js';

const router = Router();

// All company routes require a valid JWT
router.use(authMiddleware);

// POST /api/company/users — ADMIN only
router.post(
  '/users',
  roleMiddleware(['ADMIN']),
  validate(inviteUserSchema),
  companyController.inviteUser
);

// GET /api/company/users — ADMIN, FLEET_MANAGER
router.get('/users', roleMiddleware(['ADMIN', 'FLEET_MANAGER']), companyController.listUsers);

// GET /api/company/settings — All authenticated users
router.get('/settings', companyController.getSettings);

// PUT /api/company/settings — ADMIN only
router.put('/settings', roleMiddleware(['ADMIN']), companyController.updateSettings);

export default router;
