import { RequestHandler } from 'express';
import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';
import { isTest } from '../app';

const getLeaderboard: RequestHandler = async (req, res) => {
  try {
    const limitStr = req.query.limit as string;
    if (limitStr && isNaN(Number(limitStr))) {
      res.status(422).json({ message: 'Limite invalide.' });
      return;
    }

    const limit = parseInt(limitStr) || 100;

    const customerRepository = AppDataSource.getRepository(Customer);

    const leaderboard = await customerRepository
      .createQueryBuilder()
      .orderBy('points', 'DESC')
      .limit(limit)
      .getMany();

    res.json(leaderboard);
  } catch (err) {
    if (!isTest)
      console.error('Erreur lors de la récupération du leaderboard : ', err);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getLeaderboardRank: RequestHandler = async (_req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }
    const currentUserId = res.locals.user.id;

    const customerRepository = AppDataSource.getRepository(Customer);

    const leaderboard = await customerRepository
      .createQueryBuilder()
      .orderBy('points', 'DESC')
      .getMany();

    const rank =
      leaderboard.findIndex(
        (user) => user.id.toString() === currentUserId.toString()
      ) + 1;

    if (rank === 0) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    res.status(200).json({ rank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

export default { getLeaderboard, getLeaderboardRank };
