import { Request, Response, NextFunction } from 'express';

// Ce middleware gère toutes les erreurs qui se produisent dans l'application.
// Lorsqu'une erreur est lancée dans une route ou un middleware, ce gestionnaire est appelé.
// Il affiche l'erreur dans la console (utile pour le développement) et renvoie une réponse JSON
// avec le message d'erreur et un code HTTP correspondant (par défaut 500 pour les erreurs serveur).
// Cela permet d'avoir une gestion d'erreur centralisée et claire pendant le développement.

interface ErrorWithStatus extends Error {
  status?: number;
}

const errorHandler = (
  err: unknown,
  _req: Request, // préfixé avec un _ signifie que la variable est volontairement non utilisée.
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof Error) {
    console.error(err);
    res.status((err as ErrorWithStatus).status || 500).json({
      status: 'error',
      message: err.message || 'Something went wrong!',
    });
  } else {
    console.error('Unknown error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

export default errorHandler;
