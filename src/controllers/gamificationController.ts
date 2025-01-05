import { Request, Response } from 'express';

import { Customer } from '../models/Customer';
import { AppDataSource } from '../database/data-source';

const validateWasteAndIncrementPoints = async (req: Request, res: Response) => {
  const { isValidated } = req.body;

  if (typeof isValidated !== 'boolean') {
    res.status(400).json({ error: true, message: 'Données invalides.' });
    return;
  }

  const user = res.locals.user;
  if (!user || !user.customerId) {
    res.status(401).json({ error: true, message: 'Token JWT invalide' });
    return;
  }

  if (!isValidated) {
    res.status(200).json({ message: 'Validation refusée. Aucun point ajouté.' });
    return;
  }

  const customerId = user.customerId;
  
  try {
    const customer = await incrementCustomerPoints(customerId);

    if (!customer) {
      res.status(404).json({ error: true, message: 'Client introuvable.' });
      return;
    }

    res.status(200).json({
      message: 'Points mis à jour avec succès.',
      points: customer.points,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    res.status(500).json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

const incrementCustomerPoints = async (customerId: number) => {
  try {

    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return null;
    }

    customer.points += 1;
    await customerRepository.save(customer);

    return customer;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    throw new Error('Impossible de mettre à jour les points.');
  }
};

const getCustomerPoints = async (req: Request, res: Response) => {
  const user = res.locals.user;

  if (!user || !user.customerId) {
    res.status(401).json({ error: true, message: 'Token JWT invalide' });
    return;
  }

  const customerId = user.customerId;

  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      res.status(404).json({ error: true, message: 'Client introuvable.' });
      return;
    }

    res.status(200).json({
      message: 'Points récupérés avec succès.',
      points: customer.points,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des points:', error);
    res.status(500).json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

export default {
  validateWasteAndIncrementPoints,
  getCustomerPoints,
};
