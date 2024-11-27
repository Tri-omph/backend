import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import errorHandler from './middlewares/errorHandler';
import userRoutes from './routes/userRoutes';
// import { AppDataSource } from './initDatabase';

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

app.use('/api/v1/users', userRoutes);

app.use(errorHandler); // Gère les erreurs (voir src/middleware/ErrorHandler.ts). À laisser APRÈS les routes

// Initialisation BDD
// AppDataSource.initialize()
//   .then(() => {
//     console.log('Data Source has been initialized!');
//   })
//   .catch((err) => {
//     console.error('Error during Data Source initialization:', err);
//   });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
