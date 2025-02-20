import { RequestHandler } from 'express';

import { Customer } from '../models/Customer';
import { AppDataSource } from '../database/data-source';
import { UserType } from '../types/enums';

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

    if (user.type === UserType.ADMIN) {
      res.status(409).json({ message: 'This user is already an admin' });
      return;
    }

    user.type = UserType.ADMIN;
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

    if (user.type !== UserType.ADMIN) {
      res.status(409).json({ message: 'This user is not an admin' });
      return;
    }

    user.type = UserType.NORMAL;
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

    if (user.type === UserType.ADMIN) {
      res
        .status(409)
        .json({ message: 'Cannot restrict an admin. Demote first.' });
      return;
    }

    if (user.type === UserType.RESTRICTED) {
      res.status(409).json({ message: 'This user is already restricted' });
      return;
    }

    user.type = UserType.RESTRICTED;
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

    if (user.type !== UserType.RESTRICTED) {
      res.status(409).json({ message: 'This user is not restricted' });
      return;
    }

    user.type = UserType.NORMAL;
    await customerRepository.save(user);

    res
      .status(200)
      .json({ message: 'User freed from restriction successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to free user', error });
  }
};

export default {
  promoteUser,
  restrictUser,
  freeUser,
  demoteUser,
};
