import jwt from 'jsonwebtoken';
import { AppDataSource } from '../src/database/data-source';
import { Customer } from '../src/models/Customer';
import { seedDatabase } from '../src/database/seed/mainSeeder';

/* Pour créer des tests:
 * - utiliser BeforeAll pour mettre en place l'environnement (typiquement base de données en mémoire, voir ./userController.test.ts).
 * - utiliser afterAll pour réinitialiser le tout après l'ensemble des tests (pas chaque, après tous) (typiquement fermer la datasource).
 * - utiliser les équivalentss pour chaque test, beforeEach et afterEach au besoin.
 * - décrire les tests via describe ou it.
 *
 * Un describe contient un texte et une fonction, le texte décrit ce qui est testé, la fonction est la suite de tests liés à la description.
 * Dans un describe, soit on fait le code du test dans un it, soit on peut encapsuler un autre describe si on veut faire une arborescence de tests (autant de profondeur qu'on veut, tant que ça ne gêne pas la compréhension, voir ./userController.test.ts).
 *
 * Dans un it, si on veut simuler un appel à un endpoint, on utilise request de la librairie supertest (voir exemple dans ./userController.test.ts).
 * Si on veut vérifier la valeur d'une variable, on utilise expect(la_variable).toBe...(), voyez toutes les possibilités avec l'autocomplétion.
 */

export const generateExpiredJWT = (id: number, admin: boolean) => {
  const payload = { id, admin };

  const options = {
    expiresIn: -60,
  };

  return jwt.sign(payload, process.env.JWT_SECRET ?? 'your-jwt-token', options);
};

export const resetDataSource = async () => {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  const customerRepository = AppDataSource.getRepository(Customer);
  await customerRepository.clear();
  await seedDatabase(AppDataSource);
};
