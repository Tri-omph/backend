import { Router } from 'express';
import multer from 'multer';

import userController from '../controllers/userController';
import historyController from '../controllers/historyController';
import { authMiddleware } from '../middlewares/authenticate';
import { adminMiddleware } from '../middlewares/authenticateAdmin';
import { rateLimiter } from '../middlewares/rateLimiter';

// Ce fichier définit les routes de l'application. Il est responsable de gérer les chemins d'URL
// qui pointent vers des actions spécifiques dans le contrôleur. Ici, nous avons les routes liées aux utilisateurs,
// comme la création d'un utilisateur, l'authentification, etc.
// Les contrôleurs correspondants seront importés et utilisés pour traiter les demandes.

// Configuration de multer pour stocker l'image en mémoire. Cela concerne l'ajout dans l'historique !
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

const SECONDE = 1000;
const MINUTE = 60 * SECONDE;
const HEURE = 60 * MINUTE;

router.post('/', userController.createUser); // POST /api/v1/users //POST /users
router.post('/auth', userController.loginUser); //POST /api/v1/auth

router.use(authMiddleware);

router.get('/me', userController.getCurrentUser); // GET /api/v1/users/me
router.patch('/me', userController.updateCurrentUser); // PATCH /api/v1/users/me

router.get('/history/me', historyController.getCurrentHistory); // GET /api/v1/users/history/me

// 🖼️ Ajout de `upload.single('file')` pour gérer l'image
router.post(
  '/history/me',
  upload.single('file'),
  historyController.addCurrentHistory
);

router.use(adminMiddleware);

router.post('/find', userController.findUser); // POST /api/v1/users/find
router.get('/info/:id', userController.getUserInfo); // GET /api/v1/users/info/:id
router.get('/history/:id', historyController.getUserHistory); // GET /api/v1/users/history/info/:id

export default router;
