import { Router } from 'express';
import metricsController from '../controllers/metricsController';
import { authMiddleware } from '../middlewares/authenticate';
import { adminMiddleware } from '../middlewares/authenticateAdmin';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

const rateLimit = rateLimiter(1, 6 * 1000);

router.use(authMiddleware); // Authentifié

router.get('/scaninfo/me', metricsController.getMyScanInfo); // GET /api/v1/metrics/scaninfo/me
router.get('/bins/me', metricsController.getMyBins); // GET /api/v1/metrics/bins/me

router.use(adminMiddleware); // Admin

router.get('/scaninfo', metricsController.getAllScanInfo); // GET /api/v1/metrics/scaninfo
router.get('/scaninfo/:id', metricsController.getUserScanInfo); // GET /api/v1/metrics/scaninfo/:id

router.get('/bins', metricsController.getAllBins); // GET /api/v1/metrics/bins
router.get('/bins/:id', metricsController.getUserBins); // GET /api/v1/metrics/bins/:id

export default router;
