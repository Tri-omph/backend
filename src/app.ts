import 'reflect-metadata';
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import errorHandler from './middlewares/errorHandler';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import scanRoutes from './routes/scanRoutes';
import gamificationsRoutes from './routes/gamificationRoutes';
import sortingRoutes from './routes/sortingRoutes';

import { AppDataSource } from './database/data-source';
import { seedDatabase } from './database/seed/mainSeeder';

// Ce fichier est le point d'entrée principal de l'application Express.
// Il configure l'application en important et en utilisant les routes (comme userRoutes),
// ainsi que le middleware pour gérer les erreurs (errorHandler).
// Ici, on initialise l'application, on définit les routes et on gère les erreurs globales.

const app = express();

// Middleware setup
app.use(cors()); // Allow cross-origin requests
app.use(morgan('dev')); // Log requests in 'dev' format
app.use(json()); // Parse incoming JSON requests
app.use(urlencoded({ extended: true })); // Parse URL-encoded data

app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/gamification', gamificationsRoutes);
app.use('/api/v1/sort', sortingRoutes);

app.use(errorHandler); // Gère les erreurs (voir src/middleware/ErrorHandler.ts). À laisser APRÈS les routes

export const isTest = process.env.NODE_ENV === 'test';

// Initialisation BDD si on est pas en test
if (!isTest)
  AppDataSource.initialize()
    .then(async (dataSource) => {
      console.log('Data Source has been initialized!');

      // Remplir la base de données avec les valeurs par défaut (mainadmin par exemple)
      await seedDatabase(dataSource);

      // Si la BDD est bien chargée, lancer le backend
      const url = process.env.URL ?? 'http://localhost';
      const port = process.env.PORT ?? 3000;
      app.listen(port, () => {
        console.log(`Server is running on ${url}:${port}`);
      });
    })
    .catch((err) => {
      console.error('Error during Data Source initialization:', err);
    });

export default app;
