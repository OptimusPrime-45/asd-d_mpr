import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/authorize.middleware.js';

const router = Router();
const permissionController = new PermissionController();

router.use(authMiddleware);

// All authenticated users can read permissions; only ADMIN can update them.
router.get('/', permissionController.getAllPermissions);
router.put('/', roleMiddleware(['ADMIN']), permissionController.updatePermissions);

export default router;
