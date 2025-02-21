import { Router } from 'express';

import warningController from '../controllers/warningController';
import { authMiddleware } from '../middlewares/authenticate';
import { adminMiddleware } from '../middlewares/authenticateAdmin';
//import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

//const MINUTE = 60 * 1000;

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/:id', warningController.getUserWarnings); //  rateLimiter(10, MINUTE)

export default router;
