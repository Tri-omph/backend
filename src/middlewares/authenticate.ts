import { RequestHandler } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/** Middleware vérifiant si un utilisateur est connecté, et si le token n'est pas expiré
 *
 * Un router qui demande à être authentifié devra use ce middleware avant de définir les routes :
 *
 *      const router = Router();
 *      router.use(authMiddleware);
 *      router.post(...)
 */
export const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentification requise.' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? 'your_secret_key'
    );

    if (typeof decoded !== 'object' || !decoded) {
      res.status(401).json({ message: 'Token invalide.' });
      return;
    }

    res.locals.user = decoded;

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError)
      res.status(401).json({ message: 'Le token a expiré.' });
    else if (error instanceof JsonWebTokenError)
      res.status(401).json({ message: 'Token invalide.' });
    else res.status(500).json({ message: 'Erreur interne.' });
  }
};

export default {
  authMiddleware,
};
