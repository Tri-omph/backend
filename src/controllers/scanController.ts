import { Request, Response } from 'express';
import { isTest } from '../app';

const processBarcodeScan = async (req: Request, res: Response) => {
  const barcodeData = req.body.barcode;

  if (!barcodeData) {
    res
      .status(400)
      .json({ error: true, message: 'Données de scan invalides.' });
    return;
  }

  try {
    const result = await recognizeBarcode(barcodeData);

    res.status(200).json(result);
  } catch (error) {
    if (!isTest) console.error('Erreur de traitement du scan barcode:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

const recognizeBarcode = async (barcodeData: string) => {
  //Exemple
  return {
    barcode: barcodeData,
    productName: 'Example Product',
    price: 19.99,
  };

  //TODO look for the code in the database
};

const processImageScan = async (req: Request, res: Response) => {
  try {
    //TO DO
  } catch (error) {
    if (!isTest) console.error('Erreur de traitement du scan image:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

const submitWasteInfo = async (req: Request, res: Response) => {
  const { wasteType, description, recyclingInfo } = req.body;

  if (!wasteType || !description || !recyclingInfo) {
    res.status(400).json({
      error: true,
      message:
        'Informations sur les déchets invalides. Veuillez fournir wasteType, description et recyclingInfo.',
    });
    return;
  }

  try {
    const wasteInfo = {
      wasteType,
      description,
      recyclingInfo,
      submittedAt: new Date().toISOString(),
    };
    res.status(200).json({
      message: 'Informations sur les déchets soumises avec succès.',
      data: wasteInfo,
    });
  } catch (error) {
    if (!isTest) console.error('Error submitting waste info:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

export default {
  processBarcodeScan,
  processImageScan,
  submitWasteInfo,
};
