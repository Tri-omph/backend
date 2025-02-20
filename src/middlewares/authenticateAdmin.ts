import { RequestHandler } from 'express';
import { UserType } from '../types/enums';

/** Middleware vérifiant l'utilisateur connecté est administrateur.
 *
 * Un router qui demande à être administrateur devra use ce middleware avant de définir les routes, mais après être authentifié :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.use(adminMiddleware);
 *      router.post(...)
 */
export const adminMiddleware: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) {
    res.status(401).json({ message: 'Authentification requise.' });
    return;
  }

  if (res.locals.user.type != UserType.ADMIN) {
    res.status(403).json({ message: 'Droits insuffisants.' });
    return;
  }

  next();
};
