import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authenticate';
import { adminMiddleware } from '../middlewares/authenticateAdmin';
import { mainAdminMiddleware } from '../middlewares/authenticateMainAdmin';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

const rateLimit = rateLimiter(1, 30 * 1000);

router.use(authMiddleware); // Authentifié
router.use(adminMiddleware); // Admin

router.patch('/promote/:id', rateLimit, adminController.promoteUser); // PATCH /api/v1/admin/promote/:id
router.patch('/restrict/:id', rateLimit, adminController.restrictUser); // PATCH /api/v1/admin/restrict/:id
router.patch('/free/:id', rateLimit, adminController.freeUser); // PATCH /api/v1/admin/free/:id

router.use(mainAdminMiddleware); // Admin principal

router.patch('/demote/:id', rateLimit, adminController.demoteUser); // PATCH /api/v1/admin/demote/:id

export default router;
