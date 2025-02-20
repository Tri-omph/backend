// Cache pour suivre le nombre de scans par utilisateur et par produit
// ********** /!\ Cette approche de cache en mémoire n'est pas idéale NE PAS FAIRE DANS LA VRAIE VIE NON PLUS !!!
const scanCache: Map<string, { count: number; timestamp: number }> = new Map();

export const handleScan = (
  suspiciousReqNb: number,
  customerId: number,
  barcode: string
) => {
  const currentTime = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes

  // Clé unique pour cet utilisateur et ce produit
  const cacheKey = `${customerId}:${barcode}`;

  // Vérifier si l'entrée est dans le cache
  const cachedScan = scanCache.get(cacheKey);

  if (cachedScan && currentTime - cachedScan.timestamp < oneHour) {
    // Si l'utilisateur a déjà scanné ce produit dans l'heure
    cachedScan.count += 1;

    if (cachedScan.count >= suspiciousReqNb) {
      return {
        suspiciousNumberOfRequest: true,
        totalRequests: cachedScan.count,
      };
    }
  } else {
    // Si c'est la première fois ou que l'heure est passée
    scanCache.set(cacheKey, { count: 1, timestamp: currentTime });
  }

  // Aucune limite dépassée, l'utilisateur peut continuer
  return {
    suspiciousNumberOfRequest: false,
    totalRequests: scanCache.get(cacheKey)?.count || 0,
  };
};
