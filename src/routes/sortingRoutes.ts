import { Router } from 'express';
import { authMiddleware } from '../middlewares/authenticate';
import sortingController from '../controllers/sortingController';

const router = Router();

router.use(authMiddleware); // Authentifié

router.patch('/', sortingController.sortAndReward);

export default router;
