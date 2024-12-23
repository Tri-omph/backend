import { Request, RequestHandler, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';

// Ce fichier contient les fonctions de contrôleur pour gérer les actions liées aux utilisateurs.
// Les fonctions sont appelées depuis les routes définies dans `index.ts`. Chaque fonction
// correspond à une action spécifique, comme la création, la récupération ou la mise à jour des utilisateurs.

/**
 * Fonction pour créer un nouvel utilisateur
 */
const createUser = (req: Request, res: Response) => {
  // TODO
  res.status(201).json({ message: 'User created successfully' });
};

/**
 * Fonction pour récupérer les informations de l'utilisateur actuel
 */
const getCurrentUser = (req: Request, res: Response) => {
  // TODO
  res.status(200).json({ username: 'existingUser', email: 'user@example.com' });
};

/**
 * Fonction pour mettre à jour les informations de l'utilisateur actuel
 */
const updateCurrentUser = (req: Request, res: Response) => {
  // TODO
  res.status(200).json({ message: 'User updated successfully' });
};

interface UserFilter {
  id: number;
  username: string;
  pointsMin: number;
  pointsMax: number;
  gametype: string;
  login: string;
  restricted: boolean;
  admin: boolean;
}

const findUser: RequestHandler = async (req, res) => {
  const {
    id,
    username,
    pointsMin,
    pointsMax,
    gametype,
    login,
    restricted,
    admin,
  }: Partial<UserFilter> = req.query;

  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    let query = customerRepository.createQueryBuilder('customer');

    if (id !== undefined) query = query.andWhere('customer.id = :id', { id });
    if (username !== undefined)
      query = query.andWhere('customer.username LIKE %:username%', {
        username,
      });
    if (login !== undefined)
      query = query.andWhere('customer.login LIKE %:login%', {
        login,
      });
    if (restricted !== undefined)
      query = query.andWhere('customer.restricted = :restricted', {
        restricted,
      });
    if (admin !== undefined)
      query = query.andWhere('customer.admin = :admin', {
        admin,
      });
    if (pointsMin !== undefined)
      query = query.andWhere('customer.points >= :pointsMin', {
        pointsMin,
      });
    if (pointsMax !== undefined)
      query = query.andWhere('customer.points <= :pointsMax', {
        pointsMax,
      });
    if (gametype !== undefined)
      query = query.andWhere('customer.gameType = :gametype', {
        gametype,
      });

    const customers = await query.getMany();

    res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error finding users' });
  }
};

const getUserInfo: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    res.status(400).json({ message: 'Invalid ID parameter' });
    return;
  }

  try {
    const user = await AppDataSource.getRepository(Customer).findOneBy({
      id: parseInt(id),
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user info' });
  }
};

export default {
  createUser,
  getCurrentUser,
  updateCurrentUser,
  findUser,
  getUserInfo,
};
