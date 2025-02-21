import { RequestHandler } from 'express';
import { AppDataSource } from '../database/data-source';
import { Warning } from '../models/Warning';
import { Customer } from '../models/Customer';
import { isTest } from '../app';

const getUserWarnings: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    res.status(400).json({ message: 'ID utilisateur invalide.' });
    return;
  }

  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const warningRepository = AppDataSource.getRepository(Warning);

    const customer = await customerRepository.findOneBy({ id: parseInt(id) });
    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé.' });
      return;
    }

    const warnings = await warningRepository.find({
      where: { customer: { id: parseInt(id) } },
      order: { createdAt: 'DESC' },
    });

    res.status(200).json(warnings);
  } catch (error) {
    if (!isTest)
      console.error(
        'Erreur lors de la récupération des avertissements:',
        error
      );
    res.status(500).json({ message: 'Erreur de serveur.' });
  }
};

export default {
  getUserWarnings,
};
