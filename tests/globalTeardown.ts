import { AppDataSource } from '../src/database/data-source';

// Exécuté à la fin de tous les tests

const globalTeardown = async () => {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
};

export default globalTeardown;
