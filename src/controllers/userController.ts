import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { User } from '../models/User';

import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Ce fichier contient les fonctions de contrôleur pour gérer les actions liées aux utilisateurs.
// Les fonctions sont appelées depuis les routes définies dans `index.ts`. Chaque fonction
// correspond à une action spécifique, comme la création, la récupération ou la mise à jour des utilisateurs.

/**
 * Fonction pour créer un nouvel utilisateur
 */

const createUser = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'Missing required fields: username, email, password' });
    return;
  }

  const userRepository = AppDataSource.getRepository(User);

  try {
    // Check if the user already exists
    const existingUser = await userRepository.findOneBy({ login: email });

    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = userRepository.create({
      username: username,
      login: email,
      pwd_hash: hashedPassword,
    });

    // Save the new user to the database
    await userRepository.save(newUser);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error processing user creation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Fonction pour connecter un utilisateur
 */
const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const userRepository = AppDataSource.getRepository(User);

  try {
    // Find user by email
    const user = await userRepository.findOneBy({ login: email });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.pwd_hash);

    if (!validPassword) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your_secret_key', {
      expiresIn: '1h',  // Token expiration time (optional)
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Fonction pour récupérer les informations de l'utilisateur actuel
 */

//Comprendre l'histoire du token
const getCurrentUser = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

    if (typeof decoded !== 'object' || decoded === null || !('id' in decoded)) {
      res.status(401).json({ message: 'Invalid token structure' });
      return;
    }

    const decodedToken = decoded as JwtPayload;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decodedToken.id });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ username: user.username, email: user.login });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Fonction pour mettre à jour les informations de l'utilisateur actuel
 */
const updateCurrentUser = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

    if (typeof decoded !== 'object' || !('id' in decoded)) {
      res.status(401).json({ message: 'Invalid token structure' });
      return;
    }

    const decodedToken = decoded as JwtPayload;
    const userId = decodedToken.id;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updatedData = req.body;

    // Update user fields
    if (updatedData.username) user.username = updatedData.username;
    if (updatedData.email) user.login = updatedData.email;

    if (updatedData.password) {
      user.pwd_hash = await bcrypt.hash(updatedData.password, 10);
    }

    const savedUser = await userRepository.save(user);

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        username: savedUser.username,
        email: savedUser.login,
      },
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export default {
  createUser,
  getCurrentUser,
  updateCurrentUser,
  loginUser,
};
