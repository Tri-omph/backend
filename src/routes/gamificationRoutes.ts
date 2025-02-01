import { Router } from 'express';
import { authMiddleware } from '../middlewares/authenticate';
import gamificationController from '../controllers/gamificationController';

const router = Router();

router.use(authMiddleware); // Authentifié

router.get('/points', gamificationController.getCustomerPoints);

export default router;
