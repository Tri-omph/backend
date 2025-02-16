import { Router } from 'express';
import scanController from '../controllers/scanController';

// Ce fichier définit les routes de l'application. Il est responsable de gérer les chemins d'URL
// qui pointent vers des actions spécifiques dans le contrôleur. Ici, nous avons les routes liées aux utilisateurs,
// comme la création d'un utilisateur, l'authentification, etc.
// Les contrôleurs correspondants seront importés et utilisés pour traiter les demandes.

const router = Router();

const SECONDE = 1000;
const MINUTE = 60 * SECONDE;
const HEURE = 60 * MINUTE;

router.get('/barcode', scanController.processBarcodeScan); //POST /scan/barcode
router.post('/image', scanController.processImageScan); //POST /scan/image

router.post('/waste-info', scanController.submitWasteInfo); // POST /waste-info

export default router;
