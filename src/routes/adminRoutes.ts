import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authenticate';
import { adminMiddleware } from '../middlewares/authenticateAdmin';
import { mainAdminMiddleware } from '../middlewares/authenticateMainAdmin';

const router = Router();

router.use(authMiddleware); // Authentifié
router.use(adminMiddleware); // Admin

router.patch('/promote/:id', adminController.promoteUser); // PATCH /api/v1/admin/promote/:id
router.patch('/restrict/:id', adminController.restrictUser); // PATCH /api/v1/admin/restrict/:id
router.patch('/free/:id', adminController.freeUser); // PATCH /api/v1/admin/free/:id

router.use(mainAdminMiddleware); // Admin principal

router.patch('/demote/:id', adminController.demoteUser); // PATCH /api/v1/admin/demote/:id

export default router;
