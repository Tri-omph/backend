import { RequestHandler } from 'express';

/** Middleware vérifiant l'utilisateur connecté est l'administrateur principal.
 *
 * Un router qui demande à être l'administrateur principal devra use ce middleware avant de définir les routes, mais après être authentifié :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.use(mainAdminMiddleware);
 *      router.post(...)
 */
export const mainAdminMiddleware: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) {
    res.status(401).json({ message: 'Authentification requise.' });
    return;
  }

  if (!res.locals.user.admin || res.locals.user.id !== 0) {
    res.status(403).json({ message: 'Droits insuffisants.' });
    return;
  }

  next();
};
