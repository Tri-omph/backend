import { RequestHandler } from 'express';
import { AppDataSource } from '../database/data-source';
import { ScanHistory } from '../models/scanHistory';
import { ScanType, TypeBin } from '../types/enums';

const parseScans = (histo: ScanHistory[]) =>
  histo.reduce(
    (prev, curr) => {
      const valid = curr.isValid ? 1 : 0;
      switch (curr.method) {
        case ScanType.Advanced:
          return {
            ...prev,
            questions: {
              total: prev.questions.total + 1,
              correct: prev.questions.correct + valid,
            },
          };
        case ScanType.AI:
          return {
            ...prev,
            questions: {
              total: prev.ai.total + 1,
              correct: prev.ai.correct + valid,
            },
          };
        case ScanType.Barcode:
          return {
            ...prev,
            questions: {
              total: prev.barcode.total + 1,
              correct: prev.barcode.correct + valid,
            },
          };
      }
    },
    {
      ai: { total: 0, correct: 0 },
      barcode: { total: 0, correct: 0 },
      questions: { total: 0, correct: 0 },
    }
  );

const parseBins = (histo: ScanHistory[]) =>
  histo.reduce(
    (prev, curr) => {
      prev[curr.poubelle] += 1;
      return prev;
    },
    Object.values(TypeBin).reduce(
      (prev, curr) => {
        return { ...prev, [curr]: 0 };
      },
      {} as Record<TypeBin, number>
    )
  );

const isValidId = (id: string | undefined) =>
  !!id && !isNaN(Number(id)) && Number.isInteger(Number(id));

const getMyScanInfo: RequestHandler = async (_req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const customerId = res.locals.user.id;

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    res.status(200).json(parseScans(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getAllScanInfo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      res.status(400).json({ message: 'Invalid or missing ID parameter' });
      return;
    }

    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      relations: ['customer'],
    });

    res.status(200).json(parseScans(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getUserScanInfo: RequestHandler = async (req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const customerIdStr = req.params.id;

    if (!isValidId(customerIdStr)) {
      res.status(422).json({ message: 'ID non numérique.' });
      return;
    }

    const customerId = parseInt(customerIdStr, 10);

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    res.status(200).json(parseScans(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getMyBins: RequestHandler = async (_req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const customerId = res.locals.user.id;

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    res.status(200).json(parseBins(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getAllBins: RequestHandler = async (_req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      relations: ['customer'],
    });

    res.status(200).json(parseBins(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

const getUserBins: RequestHandler = async (req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const customerIdStr = req.params.id;

    if (!isValidId(customerIdStr)) {
      res.status(422).json({ message: 'ID non numérique.' });
      return;
    }

    const customerId = parseInt(customerIdStr, 10);

    const scanHistoryRepository = AppDataSource.getRepository(ScanHistory);
    const histo = await scanHistoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    res.status(200).json(parseBins(histo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

export default {
  getMyScanInfo,
  getAllScanInfo,
  getUserScanInfo,
  getMyBins,
  getAllBins,
  getUserBins,
};
