import { sign } from 'jsonwebtoken';
import { JWT_EXPIRATION } from './constants';
import { TypeDisposable } from './types/enums';

/**
 * Vérifie si une chaîne respecte les contraintes d'un email valide selon RFC 5322 :
 * - Jamais 2 points d'affilée (?!\.\.)
 * - Commence par une lettre [a-zA-Z\d]
 * - Suivi de jusqu'à 63 autres caractères autorisés [a-zA-Z_%+\-.\d+]{0,63}
 * - Un arobase
 * - Suivi d'au moins 1 sous domaines ([a-zA-Z\d]+(-[a-zA-Z\d]+)*\.)+
 *   - Chaque sous-domaine peut contenir des lettres et des chiffres [a-zA-Z\d]+
 *   - qui peut contenir des tirets, mais ni au début ni à la fin (-[a-zA-Z\d]+)*
 * - Suivi de l'IDN, entre 2 et 6 caractères [a-zA-Z]{2,6}
 */
export const emailRegex =
  /^(?!\.\.)([a-zA-Z\d][a-zA-Z_%\-.\d+]{0,63})@([a-zA-Z\d]+(-[a-zA-Z\d]+)*\.)+[a-zA-Z]{2,6}$/;

/**
 * Vérifie si une chaîne respecte les contraintes d'un email valide selon RFC 5322 :
 * - Jamais 2 points d'affilée (?!\.\.)
 * - Commence par une lettre [a-zA-Z\d]
 * - Suivi de jusqu'à 63 autres caractères autorisés [a-zA-Z_%+-.\d+]{0,63}
 * - Un arobase
 * - Suivi d'au moins 1 sous domaines ([a-zA-Z\d]+(-[a-zA-Z\d]+)*\.)+
 *   - Chaque sous-domaine peut contenir des lettres et des chiffres [a-zA-Z\d]+
 *   - qui peut contenir des tirets, mais ni au début ni à la fin (-[a-zA-Z\d]+)*
 * - Suivi de l'IDN, entre 2 et 6 caractères [a-zA-Z]{2,6}
 * - L'email complet ne dépasse pas 254 caractères.
 */
export const verifyEmail = (email: string): boolean =>
  email.length < 255 && emailRegex.test(email);

/**
 * Vérifie si un string respecte les contraintes d'un pseudonyme :
 * - Commence par une lettre [a-zA-Z]
 * - Ne contient que des lettres, chiffres, tirets et underscores [a-zA-Z0-9_-]
 * - Fais entre 3 et 30 caractères (le caractère de départ + ) {2,29}
 */
export const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;

/**
 * Vérifie si un string respecte les contraintes d'un mot de passe :
 * - Contient au moins une minuscule (?=.*[a-z])
 * - Contient au moins une majuscule (?=.*[A-Z])
 * - Contient au moins un chiffre (?=.*\d)
 * - Contient au moins un caractère spécial (?=.*[!@#$%^&*()_+={}|[\]\\:";'<>?,./])
 *   - Liste des caractères spéciaux considérés: !@#$%^&*()_+={}|[]\:";'<>?,./
 * - Contient au moins 8 caractères .{8,}
 */
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}|[\]\\:";'<>?,./]).{8,}$/;

export const generateJWT = (id: number, admin: boolean) =>
  sign({ id, admin }, process.env.JWT_SECRET ?? 'your_secret_key', {
    expiresIn: JWT_EXPIRATION,
  });

// Define synonyms for each type
export const trashTypeSynonyms: { [key: string]: string[] } = {
  paper: ['papier', 'paper'],
  plastic: ['plastique', 'plastic'],
  cardboard: ['carton', 'cardboard'],
  glass: ['verre', 'glass'],
  metal: ['métal', 'metal'],
  textile: ['textile'],
  used: ['ordure', 'trash'],
  device: ['pile', 'batterie', 'appareil', 'battery'],
  organic: ['organique', 'nourriture', 'aliment', 'organic'],
  damaged: ['endommagé', 'damaged'],
  dishes: ['vaisselle', 'dishes'],
  not_packaging: ['non_emballage', 'not packaging'],
  medicine: ['médicament', 'medicine'],
  toxic: ['toxique', 'toxic'],
  bulky_waste: ['encombrant', 'bulky waste'],
};

export const trashTypeMapping: { [key: string]: TypeDisposable } = {
  paper: TypeDisposable.PAPER,
  plastic: TypeDisposable.PLASTIC_PACKAGING,
  cardboard: TypeDisposable.CARDBOARD_PACKAGING,
  glass: TypeDisposable.GLASS_PACKAGING,
  metal: TypeDisposable.METAL_PACKAGING,
  used: TypeDisposable.USED,
  damaged: TypeDisposable.DAMAGED,
  dishes: TypeDisposable.DISHES,
  organic: TypeDisposable.ORGANIC,
  not_packaging: TypeDisposable.NOT_PACKAGING,
  medicine: TypeDisposable.MEDICINE,
  toxic: TypeDisposable.TOXIC,
  device: TypeDisposable.DEVICE,
  textile: TypeDisposable.TEXTILE,
  bulky_waste: TypeDisposable.BULKY_WASTE,
};


