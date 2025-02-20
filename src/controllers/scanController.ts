import { Request, Response, RequestHandler } from 'express';
import { isTest } from '../app';
import { handleWarning } from '../services/warningService';
import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/Customer';

const processBarcodeScan: RequestHandler = async (req, res) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    const { barcode } = req.query; // Extraire le barcode de l'URL

    if (!barcode) {
      res.status(400).json({ error: 'Le codebarre est requis !' });
      return;
    }

    const customerId = res.locals.user.id;

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOneBy({ id: customerId });

    if (!customer) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    const hasGotWarning = await handleWarning(customer, barcode.toString(), 5);
    const result = await getProductInfo(barcode.toString());

    if (!result.productFound) {
      res.status(404).json({ error: 'Produit non trouvé !' });
      return;
    }

    if (hasGotWarning.confirmed) {
      res.status(200).json({
        ...result,
        warning: true,
        nbRequestsForBarcode: hasGotWarning.totalRequests,
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    if (!isTest) console.error('Erreur de traitement du scan barcode:', error);
    res
      .status(500)
      .json({ error: true, message: 'Erreur interne du serveur.' });
  }
};

const removePrefix = (str: string): string => {
  return str.startsWith('en:') ? str.substring(3) : str;
};

const materialMapping: { [key: string]: string } = {
  'pet-1-polyethylene-terephthalate': 'plastic',
  'pp-5-polypropylene': 'plastic',
  'hdpe-2-high-density-polyethylene': 'plastic',
};

const fromScientificToCommon = (englishMaterial: string): string => {
  return materialMapping[englishMaterial.toLowerCase()] || englishMaterial;
};

const getProductInfo = async (
  barcode: string
): Promise<{
  productFound: boolean;
  productPackagingMaterial: string;
}> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;
      const packagingMaterials = product.packaging_materials_tags || [
        'Informations non disponibles',
      ];
      return {
        productFound: true,
        productPackagingMaterial: fromScientificToCommon(
          removePrefix(packagingMaterials[0])
        ),
      }; // Produit trouvé
    } else {
      return {
        productFound: false,
        productPackagingMaterial: 'Produit non trouvé dans la base de données.',
      }; // Produit non trouvé
    }
  } catch (error) {
    return {
      productFound: false,
      productPackagingMaterial:
        'Erreur lors de la récupération des informations.',
    }; // Erreur réseau ou autre
  }
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
