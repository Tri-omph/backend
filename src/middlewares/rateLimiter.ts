import rateLimit from 'express-rate-limit';

/**
 * Middleware qui limite le nombre de demande provenant d'une même IP pendant un temps donné.
 * @param nRequest Nombre de requête par unité de temps
 * @param dureeMS Temps autorisé pour le nombre de requête en millisecondes
 * Permet de limiter à nRequest/dureeMS requêtes par utilisateur
 * @returns le middleware
 */
const rateLimiter = (nRequest: number, dureeMS: number) =>
  rateLimit({
    windowMs: dureeMS,
    max: nRequest,
    message: {
      message: 'Limite de requêtes atteinte.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

export { rateLimiter };
