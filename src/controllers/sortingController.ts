import { Request, Response } from 'express';
import gamificationController from '../controllers/gamificationController';

const sortAndReward = async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    const customer = await gamificationController.incrementCustomerPoints(
      user.id
    );

    if (!customer) {
      res.status(404).json({ error: true, message: 'Client introuvable.' });
      return;
    }

    res.status(200).json({
      message: 'Déchet trié avec succès ! ✅',
      points: customer.points,
      level: gamificationController.getCustomerLevel(customer.points),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

export default { sortAndReward };
