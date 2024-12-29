import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';

// Ce fichier contient les fonctions de contrôleur pour gérer les actions liées aux utilisateurs.
// Les fonctions sont appelées depuis les routes définies dans `index.ts`. Chaque fonction
// correspond à une action spécifique, comme la création, la récupération ou la mise à jour des utilisateurs.

/**
 * Fonction pour créer un nouvel utilisateur
 */
const createUser: RequestHandler = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'Entrée invalide' });
    return;
  }

  const customerRepository = AppDataSource.getRepository(Customer);

  try {
    const existingEmail = await customerRepository.findOneBy({ login: email });
    const existingUser = await customerRepository.findOneBy({
      username: username,
    });

    if (existingEmail) {
      res.status(409).json({ message: "L'email existe déjà." });
      return;
    }
    if (existingUser) {
      res.status(409).json({ message: "Le nom d'utilisateur existe déjà." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = customerRepository.create({
      username: username,
      login: email,
      pwd_hash: hashedPassword,
    });

    await customerRepository.save(newCustomer);

    const token = jwt.sign(
      { id: newCustomer.id, username: newCustomer.username },
      process.env.JWT_SECRET ?? 'your_secret_key'
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      token: token,
    });
  } catch (error) {
    console.error('Erreur lors de l inscription:', error);
    res.status(500).json({ message: 'Erreur de serveur interne.' });
  }
};

/**
 * Fonction pour connecter un utilisateur
 */
const loginUser: RequestHandler = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res
      .status(400)
      .json({ message: 'Nom d utilisateur ou mot de passe requis.' });
    return;
  }

  const customerRepository = AppDataSource.getRepository(Customer);

  try {
    const customer = await customerRepository.findOneBy({ username: username });

    if (!customer) {
      res
        .status(401)
        .json({ error: true, message: ' Nom d utilisateur incorrect.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, customer.pwd_hash);

    if (!validPassword) {
      res.status(401).json({ error: true, message: 'Mot de passe incorrect.' });
      return;
    }

    const token = jwt.sign(
      { id: customer.id, username: customer.username },
      process.env.JWT_SECRET ?? 'your_secret_key',
      {}
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
};

/**
 * Fonction pour récupérer les informations de l'utilisateur actuel
 */
const getCurrentUser: RequestHandler = async (_req, res) => {
  try {
    const customerId = res.locals.user?.id;

    if (!customerId) {
      res.status(401).json({ message: 'Pas d id dans le token' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    res
      .status(200)
      .json({ username: customer.username, email: customer.login });
  } catch (error) {
    console.error('Erreur lors de la récupération de l utilisateur:', error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
};

/**
 * Fonction pour mettre à jour les informations de l'utilisateur actuel
 */
const updateCurrentUser: RequestHandler = async (req, res) => {
  try {
    const customerId = res.locals.user?.id;

    if (!customerId) {
      res.status(401).json({ message: 'Unauthorized: No user ID in token' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    const updatedData = req.body;

    // Update user fields
    if (updatedData.username) customer.username = updatedData.username;
    if (updatedData.email) customer.login = updatedData.email;

    if (updatedData.password) {
      customer.pwd_hash = await bcrypt.hash(updatedData.password, 10);
    }

    await customerRepository.save(customer);

    res.status(200).json({
      message:
        'Les informations de l utilisateur ont été mises à jour avec succès.',
    });
  } catch (err) {
    console.error('Erreur lors de la MAJ de l utilisateur:', err);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
};

interface UserFilter {
  id: number;
  username: string;
  pointsMin: number;
  pointsMax: number;
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
  loginUser,
};
