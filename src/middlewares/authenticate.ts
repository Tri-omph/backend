import { Request, Response, NextFunction } from 'express';

/** Middleware vérifiant si un utilisateur est connecté, et si le token n'est pas expiré
 *
 * Un router qui demande à être authentifié devra use ce middleware avant de définir les routes :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.post(...)
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  // TODO: Valider le JWT avec la lib jsonwebtoken
  next();
};

// idée : des middlewares pour la sécurité (éviter les injection SQL, XSS etc.)
