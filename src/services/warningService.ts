import { AppDataSource } from '../database/data-source';
import { Warning } from '../models/Warning';
import { Customer } from '../models/Customer';
import { handleScan } from './scanService';

export const handleWarning = async (
  customer: Customer,
  barcode: string,
  suspiciousReqNb: number
): Promise<{ confirmed: boolean; totalRequests: number }> => {
  // Retourne un booléen
  const currentTime = new Date();
  const warningRepository = AppDataSource.getRepository(Warning);

  // Appel à handleScan pour obtenir le nombre total de requêtes
  const { suspiciousNumberOfRequest, totalRequests } = handleScan(
    suspiciousReqNb,
    customer.id,
    barcode
  );

  // Si le nombre total de requêtes NE dépasse PAS le seuil suspect
  if (!suspiciousNumberOfRequest) {
    return { confirmed: false, totalRequests };
  }

  // Chercher les avertissements existants pour cet utilisateur et ce produit
  const existingWarning = await warningRepository.findOne({
    where: {
      customer: customer,
      barcode: barcode,
    },
  });

  // Si un avertissement existe déjà (dans le delta t1; t2)
  if (existingWarning) {
    const t1 = existingWarning.createdAt;
    const t2 = new Date(t1);
    t2.setHours(t1.getHours() + 1);

    // Vérifier si l'avertissement est toujours valide (dans la même heure)
    if (currentTime <= t2) {
      existingWarning.scanCount = totalRequests;
      await warningRepository.save(existingWarning);
      return { confirmed: true, totalRequests };
    }
  }

  // Si aucun avertissement n'existe ou que la période est expirée, créer un nouveau warning
  const newWarning = warningRepository.create({
    customer: customer,
    barcode: barcode,
    scanCount: totalRequests,
  });

  await warningRepository.save(newWarning);
  return { confirmed: true, totalRequests };
};
