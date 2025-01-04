import { Router } from 'express';
import { authMiddleware } from '../middlewares/authenticate';
import gamificationController from '../controllers/gamificationController';

const router = Router();

router.use(authMiddleware); // Authentifié

router.patch('game/points', gamificationController.validateWasteAndIncrementPoints); // PATCH /api/v1/game/points
router.get('/customer/points', gamificationController.getCustomerPoints); 

export default router;
