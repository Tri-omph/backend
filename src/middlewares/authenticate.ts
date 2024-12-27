import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

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
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? 'your_secret_key'
    );

    if (typeof decoded !== 'object' || !decoded) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    res.locals.user = decoded;

    next();
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(401).json({ message: 'Unauthorized: Token invalid or expired' });
  }
};

export default {
  authMiddleware,
};
