import { Router } from 'express';
import gamificationController from '../controllers/gamificationController';
import { rateLimiter } from '../middlewares/rateLimiter';
import { authMiddleware } from '../middlewares/authenticate';

const router = Router();

const SECONDE = 1000;
const MINUTE = 60 * SECONDE;

router.get(
  '/leaderboard',
  rateLimiter(1, MINUTE),
  gamificationController.getLeaderboard
); // GET /api/v1/game/leaderboard

router.use(authMiddleware);

router.get(
  '/leaderboard/me',
  rateLimiter(5, MINUTE),
  gamificationController.getLeaderboardRank
); // GET /api/v1/game/leaderboard/me

export default router;
