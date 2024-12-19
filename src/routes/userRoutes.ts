import { Router } from 'express';
import userController from '../controllers/userController';
import  authenticate from '../middlewares/authenticate';

// Ce fichier définit les routes de l'application. Il est responsable de gérer les chemins d'URL
// qui pointent vers des actions spécifiques dans le contrôleur. Ici, nous avons les routes liées aux utilisateurs,
// comme la création d'un utilisateur, l'authentification, etc.
// Les contrôleurs correspondants seront importés et utilisés pour traiter les demandes.

const router = Router();

router.post('/', userController.createUser); // POST /api/v1/users //POST /users
router.post('/auth', userController.loginUser); //POST /api/v1/auth
router.use(authenticate.authMiddleware);
router.get('/me', userController.getCurrentUser); // GET /api/v1/users/me
router.patch('/me', userController.updateCurrentUser); // PATCH /api/v1/users/me

export default router;
