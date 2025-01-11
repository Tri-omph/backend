import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';

import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';
import { isTest } from '../app';
import {
  generateJWT,
  passwordRegex,
  usernameRegex,
  verifyEmail,
} from '../utils';

// Ce fichier contient les fonctions de contrôleur pour gérer les actions liées aux utilisateurs.
// Les fonctions sont appelées depuis les routes définies dans `index.ts`. Chaque fonction
// correspond à une action spécifique, comme la création, la récupération ou la mise à jour des utilisateurs.

/**
 * Fonction pour créer un nouvel utilisateur
 */
const createUser: RequestHandler = async (req, res) => {
  const { username, password, email } = req.body;

  if (!usernameRegex.test(username)) {
    res.status(422).json({
      message: 'Pseudonyme invalide.',
    });
    return;
  }

  if (!username || !email || !password) {
    res.status(400).json({
      message: 'Tous les champs sont requis.',
    });
    return;
  }

  if (!verifyEmail(email)) {
    res.status(422).json({ message: 'Adresse email invalide.' });
    return;
  }

  if (!passwordRegex.test(password)) {
    res.status(422).json({
      message:
        "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères.",
    });
    return;
  }

  const customerRepository = AppDataSource.getRepository(Customer);

  try {
    const existingEmail = await customerRepository.findOneBy({
      login: email.toLowerCase(),
    });
    if (existingEmail) {
      res.status(409).json({ message: "L'email existe déjà." });
      return;
    }

    const existingUser = await customerRepository.findOneBy({
      username,
    });
    if (existingUser) {
      res.status(409).json({ message: 'Ce pseudonyme existe déjà.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = customerRepository.create({
      username: username,
      login: email.toLowerCase(),
      pwd_hash: hashedPassword,
    });

    await customerRepository.save(newCustomer);

    const token = generateJWT(newCustomer.id, false);

    res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      token: token,
    });
  } catch (error) {
    if (!isTest) console.error('Erreur lors de l inscription:', error);
    res.status(500).json({ message: 'Erreur de serveur interne.' });
  }
};

/**
 * Fonction pour connecter un utilisateur
 */
const loginUser: RequestHandler = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).json({ message: 'Identifiant et mot de passe requis.' });
    return;
  }
  const customerRepository = AppDataSource.getRepository(Customer);

  try {
    let customer: Customer | null;
    if (verifyEmail(login))
      customer = await customerRepository.findOneBy({ login: login });
    else customer = await customerRepository.findOneBy({ username: login });

    if (!customer) {
      res.status(401).json({ error: true, message: 'Identifiants incorrect.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, customer.pwd_hash);

    if (!validPassword) {
      res.status(401).json({ error: true, message: 'Identifiants incorrect.' });
      return;
    }

    const token = generateJWT(customer.id, customer.admin);

    res.status(200).json({ token });
  } catch (error) {
    if (!isTest) console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
};

/**
 * Fonction pour récupérer les informations de l'utilisateur actuel
 */
const getCurrentUser: RequestHandler = async (_req, res) => {
  try {
    const customerId = res.locals.user.id;

    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    res.status(200).json(customer);
  } catch (error) {
    if (!isTest)
      console.error('Erreur lors de la récupération de l utilisateur:', error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
};

/**
 * Fonction pour mettre à jour les informations de l'utilisateur actuel
 */
const updateCurrentUser: RequestHandler = async (req, res) => {
  try {
    const customerId = res.locals.user.id;

    if (!customerId) {
      res.status(401).json({ message: 'Token invalide.' });
      return;
    }

    const { username, email, password } = req.body;

    if (!username && !email && !password) {
      res.status(400).json({ message: 'Aucune modification indiquée.' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé.' });
      return;
    }

    if (username && username !== customer.username) {
      if (!usernameRegex.test(username)) {
        res.status(422).json({ message: 'Pseudonyme invalide.' });
        return;
      }

      const duplicateUsername = await customerRepository.findBy({ username });
      if (
        duplicateUsername.length !== 0 &&
        duplicateUsername[0].id != customerId
      ) {
        res.status(409).json({ message: 'Ce pseudonyme est déjà pris.' });
        return;
      }

      customer.username = username;
    }

    if (email && email !== customer.login) {
      if (!verifyEmail(email)) {
        res.status(422).json({ message: 'Adresse email invalide.' });
        return;
      }

      const duplicateEmail = await customerRepository.findBy({ login: email });
      if (duplicateEmail.length !== 0 && duplicateEmail[0].id != customerId) {
        res
          .status(409)
          .json({ message: 'Cette adresse mail est déjà liée à un compte.' });
        return;
      }

      customer.login = email;
    }

    if (password) {
      if (!passwordRegex.test(password)) {
        res.status(422).json({
          message:
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères.",
        });
        return;
      }

      customer.pwd_hash = await bcrypt.hash(password, 10);
    }

    await customerRepository.save(customer);

    res.status(200).json({
      message:
        "Les informations de l'utilisateur ont été mises à jour avec succès.",
    });
  } catch (err) {
    if (!isTest) console.error('Erreur lors de la MAJ de l utilisateur:', err);
    res.status(500).json({ message: 'Erreur de serveur.' });
  }
};

/**
 * Fonction pour obtenir les information d'un utilisateur par id, pour les admins seulement
 */
const getUserInfo: RequestHandler = async (req, res) => {
  const { id } = req.params;
  if (!id || id === '') {
    res.status(400).json({ message: 'Aucun ID fourni.' });
    return;
  }

  if (isNaN(parseInt(id))) {
    res.status(422).json({ message: "L'ID n'est pas numérique." });
    return;
  }

  try {
    const user = await AppDataSource.getRepository(Customer).findOneBy({
      id: parseInt(id),
    });

    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    if (!isTest) console.error(error);
    res.status(500).json({ message: 'Error fetching user info' });
  }
};

export interface UserFilter {
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
  }: Record<keyof UserFilter, unknown> = req.body;
  // TODO: changer de params à query, donc de POST à GET

  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    // Si aucun paramètre n'est donné, on prend tout
    if (
      [id, username, pointsMin, pointsMax, login, restricted, admin]
        .map((e) => e === undefined || e === '')
        .reduce((p, c) => p && c, true)
    ) {
      const customers = await customerRepository.find();
      res.status(200).json(customers);
      return;
    }

    let query = customerRepository.createQueryBuilder('customer');

    if (id !== undefined) {
      if (typeof id !== 'number' || isNaN(id)) {
        res.status(422).send({ message: 'id invalide.' });
        return;
      }
      query = query.andWhere('customer.id = :id', { id });
    }

    if (username !== undefined)
      query = query.andWhere('customer.username LIKE :username', {
        username: `%${username}%`,
      });

    if (login !== undefined)
      query = query.andWhere('customer.login LIKE :login', {
        login: `%${login}%`,
      });

    if (restricted !== undefined) {
      if (typeof restricted !== 'boolean') {
        res.status(422).send({ message: 'restricted invalide.' });
        return;
      }
      query = query.andWhere('customer.restricted = :restricted', {
        restricted,
      });
    }

    if (admin !== undefined) {
      if (typeof admin !== 'boolean') {
        res.status(422).send({ message: 'admin invalide.' });
        return;
      }
      query = query.andWhere('customer.admin = :admin', {
        admin,
      });
    }

    if (pointsMin !== undefined) {
      if (typeof pointsMin !== 'number' || isNaN(pointsMin)) {
        res.status(422).send({ message: 'pointsMin invalide.' });
        return;
      }
      if (pointsMin < 0) {
        res.status(422).send({ message: 'pointsMin négatif.' });
        return;
      }
      query = query.andWhere('customer.points >= :pointsMin', {
        pointsMin,
      });
    }

    if (pointsMax !== undefined) {
      if (typeof pointsMax !== 'number' || isNaN(pointsMax)) {
        res.status(422).send({ message: 'pointsMax invalide.' });
        return;
      }
      query = query.andWhere('customer.points <= :pointsMax', {
        pointsMax: pointsMax,
      });
    }

    if (
      typeof pointsMin === 'number' &&
      typeof pointsMax === 'number' &&
      pointsMax < pointsMin
    ) {
      res
        .status(422)
        .send({ message: 'Le minimum est plus grand que le maximum.' });
      return;
    }

    const customers = await query.getMany();

    res.status(200).json(customers);
  } catch (error) {
    if (!isTest) console.error(error);
    res.status(500).json({ message: 'Error finding users' });
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
