import { RequestHandler } from 'express';

import { Customer } from '../models/Customer';
import { AppDataSource } from '../database/data-source';
import { passwordRegex, verifyEmail } from '../utils';
import { randomBytes } from 'crypto';
import { hash } from 'bcrypt';

const customerRepository = AppDataSource.getRepository(Customer);

const isValidId = (id: string | undefined) =>
  !!id && !isNaN(Number(id)) && Number.isInteger(Number(id));

/**
 * Fonction pour promouvoir un utilisateur en admin
 */
const promoteUser: RequestHandler = async (req, res) => {
  const { id } = req.params; // On récupère le :id dans l'URL

  if (!isValidId(id)) {
    res.status(400).json({ message: 'Invalid or missing ID parameter' });
    return;
  }

  try {
    const user = await customerRepository.findOneBy({ id: parseInt(id) });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.admin) {
      res.status(409).json({ message: 'This user is already an admin' });
      return;
    }

    user.admin = true;
    await customerRepository.save(user);

    res.status(200).json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to promote user', error: error });
  }
};

/**
 * Fonction pour rétrograder un admin en utilisateur
 */
const demoteUser: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: 'Invalid or missing ID parameter' });
    return;
  }

  try {
    const user = await customerRepository.findOneBy({ id: parseInt(id) });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.admin) {
      res.status(409).json({ message: 'This user is not an admin' });
      return;
    }

    user.admin = false;
    await customerRepository.save(user);

    res.status(200).json({ message: 'User demoted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to demote user', error });
  }
};

/**
 * Fonction pour restreindre l'utilisateur
 */
const restrictUser: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: 'Invalid or missing ID parameter' });
    return;
  }

  try {
    const user = await customerRepository.findOneBy({ id: parseInt(id) });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.admin) {
      res
        .status(409)
        .json({ message: 'Cannot restrict an admin. Demote first.' });
      return;
    }

    if (user.restricted) {
      res.status(409).json({ message: 'This user is already restricted' });
      return;
    }

    user.restricted = true;
    await customerRepository.save(user);

    res.status(200).json({ message: 'User restricted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restrict user', error });
  }
};

/**
 * Fonction pour ne plus restreindre l'utilisateur indiqué
 */
const freeUser: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: 'Invalid or missing ID parameter' });
    return;
  }

  try {
    const user = await customerRepository.findOneBy({ id: parseInt(id) });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.restricted) {
      res.status(409).json({ message: 'This user is not restricted' });
      return;
    }

    user.restricted = false;
    await customerRepository.save(user);

    res
      .status(200)
      .json({ message: 'User freed from restriction successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to free user', error });
  }
};

const createAdmin: RequestHandler = async (req, res) => {
  if (!res.locals.user) {
    res.status(401).json({ message: 'Authentification requise.' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Adresse email requis.' });
    return;
  }

  if (!verifyEmail(email)) {
    res.status(422).json({ message: 'Adresse email invalide.' });
    return;
  }

  let password = randomBytes(length).toString('base64').slice(0, length);
  while (!passwordRegex.test(password))
    password = randomBytes(length).toString('base64').slice(0, length);

  const customerRepository = AppDataSource.getRepository(Customer);

  try {
    const existingEmail = await customerRepository.findOneBy({
      login: email.toLowerCase(),
    });
    if (existingEmail) {
      res.status(409).json({ message: "L'email existe déjà." });
      return;
    }

    const existingUsers = await customerRepository
      .createQueryBuilder()
      .where("username LIKE 'admin%'")
      .getMany();

    const usernamesSuffix = existingUsers
      .map((c) => c.username.slice(5))
      .filter((c) => !isNaN(Number(c)))
      .map((c) => parseInt(c))
      .sort((a, b) => a - b);

    let i = 0;
    while (usernamesSuffix[i] === i) i++;
    const username = `admin${i}`;

    const hashedPassword = await hash(password, 10);

    const newCustomer = customerRepository.create({
      username: username,
      login: email.toLowerCase(),
      pwd_hash: hashedPassword,
    });

    await customerRepository.save(newCustomer);

    res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      username,
      password,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de serveur interne.' });
  }
};

export default {
  promoteUser,
  restrictUser,
  freeUser,
  demoteUser,
  createAdmin,
};
