import { Request, Response, NextFunction } from 'express';

/** Middleware vérifiant l'utilisateur connecté est l'administrateur principal.
 *
 * Un router qui demande à être l'administrateur principal devra use ce middleware avant de définir les routes, mais après être authentifié :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.use(mainAdminMiddleware);
 *      router.post(...)
 */
export const mainAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!res.locals.user)
    return res.status(401).json({ message: 'Authentication required' });

  if (!res.locals.user.admin || res.locals.user.id !== 0)
    return res.status(401).json({ message: 'Main admin privileges required' });

  next();
};
