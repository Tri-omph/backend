import { Router } from 'express';
import userController from '../controllers/userController';
import { adminMiddleware } from '../middlewares/authenticateAdmin';

// Ce fichier définit les routes de l'application. Il est responsable de gérer les chemins d'URL
// qui pointent vers des actions spécifiques dans le contrôleur. Ici, nous avons les routes liées aux utilisateurs,
// comme la création d'un utilisateur, l'authentification, etc.
// Les contrôleurs correspondants seront importés et utilisés pour traiter les demandes.

const router = Router();

router.post('/', userController.createUser); // POST /api/v1/users
router.get('/me', userController.getCurrentUser); // GET /api/v1/users/me
router.patch('/me', userController.updateCurrentUser); // PATCH /api/v1/users/me

router.use(adminMiddleware);

router.post('/find', userController.findUser); // POST /api/v1/users/find
router.get('/info/:id', userController.getUserInfo); // GET /api/v1/users/info/:id

export default router;
