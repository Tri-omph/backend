import { Request, Response } from 'express';

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

    if (result.error) {
      res.status(404).json({
        error: true,
        message: 'Produit non trouvé dans la base de données Open Food Facts.',
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur de traitement du scan barcode:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

const recognizeBarcode = async (barcodeData: string) => {
  const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcodeData}.json`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 1) {
      return data.product;
    } else {
      return { error: true, message: 'Produit non trouvé.' };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de l\'API:', error);
    throw new Error('Impossible de récupérer les données du produit.');
  }
};

const processImageScan = async (req: Request, res: Response) => {
  try {
    //TO DO
  } catch (error) {
    console.error('Erreur de traitement du scan image:', error);
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
    console.error('Error submitting waste info:', error);
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
