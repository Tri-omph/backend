import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

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
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }
  
    try {
 
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
      
      if (typeof decoded !== 'object' || !decoded) {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
        return;
      }
  

      req.user = decoded as JwtPayload;
  
      next();
    } catch (err) {
      console.error('Token validation error:', err);
      res.status(401).json({ message: 'Unauthorized: Token invalid or expired' });
    }
  };

  export default {
    authMiddleware,
  };

// idée : un middleware pour admin?
// idée : des middlewares pour la sécurité (éviter les injection SQL, XSS etc.)
