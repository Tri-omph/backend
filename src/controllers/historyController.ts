import { RequestHandler } from 'express';
import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';
import { isTest } from '../app';
import { ScanHistory } from '../models/scanHistory';
import { incrementCustomerPoints } from '../services/gamification';

const getScanHistoryByCustomerId = async (
  customerId: number
): Promise<ScanHistory[] | null> => {
  try {
    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    return await scanHistoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
};

const getCurrentHistory: RequestHandler = async (_req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }
    const customerId = res.locals.user.id;

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé.' });
      return;
    }

    const history = await getScanHistoryByCustomerId(customerId);

    if (history === null) {
      res.status(500).json({ message: 'Erreur interne.' });
      return;
    }

    // Convertir l'image en Base64 (si présente)
    const historyWithImage = history.map((item) => ({
      ...item,
      image: item.image ? item.image.toString('base64') : null, // Conversion en base64
    }));

    res.status(200).json(historyWithImage);
  } catch (error) {
    if (!isTest)
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const addCurrentHistory: RequestHandler = async (req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const { method, isValid, poubelle, type } = req.body;
    const customerId = res.locals.user.id;

    if (!method || isValid === undefined || !poubelle || !type) {
      res.status(400).json({ message: 'Tous les champs sont requis.' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const historyRepository = AppDataSource.getRepository(ScanHistory);

    const customer = await customerRepository.findOneBy({ id: customerId });
    if (!customer) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    // 🖼️ Récupérer l’image (si présente) en `Buffer`
    const imageBuffer = req.file ? req.file.buffer : undefined;

    console.log('Image buffer:', req.file); // Vérifie la valeur de imageBuffer

    const newHistory = historyRepository.create({
      customer,
      method,
      isValid,
      poubelle,
      type,
      date: new Date(),
      image: imageBuffer,
    });

    await historyRepository.save(newHistory);

    // Ajouter les points
    await incrementCustomerPoints(customer);

    // 🏆 Recharger les points pour envoyer les points mis à jour
    const updatedCustomer = await customerRepository.findOneBy({
      id: customerId,
    });

    res.status(201).json({
      message: "Entrée de l'historique créée avec succès.",
      points: updatedCustomer ? updatedCustomer.points : customer.points,
    });
    return;
  } catch (error) {
    console.error("Erreur lors de l'ajout dans l'historique :", error);
    res.status(500).json({ message: 'Erreur interne.' });
    return;
  }
};

const getUserHistory: RequestHandler = async (req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(422).json({ message: 'ID non numérique.' });
      return;
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const historyRepository = AppDataSource.getRepository(ScanHistory);

    const customer = await customerRepository.findOneBy({ id: userId });
    if (!customer) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    const history = await historyRepository.find({
      where: { customer },
      order: { date: 'DESC' },
    });

    res.status(200).json(history);
  } catch (error) {
    if (!isTest)
      console.error("Erreur pour la récupération de l'historique :", error);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

export default { getCurrentHistory, addCurrentHistory, getUserHistory };
