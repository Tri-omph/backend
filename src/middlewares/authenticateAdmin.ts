import { RequestHandler } from 'express';

/** Middleware vérifiant l'utilisateur connecté est administrateur.
 *
 * Un router qui demande à être administrateur devra use ce middleware avant de définir les routes, mais après être authentifié :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.use(adminMiddleware);
 *      router.post(...)
 */
export const adminMiddleware: RequestHandler = (req, res, next) => {
  if (!res.locals.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!res.locals.user.admin) {
    res.status(401).json({ message: 'Admin privileges required' });
    return;
  }

  next();
};
