import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Ce fichier définit le modèle "User" qui représente un utilisateur dans l'application.
 * Il utilise TypeORM pour interagir avec la base de données.
 *
 * Le modèle contient plusieurs propriétés :
 * - `id`: l'identifiant unique de l'utilisateur (généré automatiquement par la base de données).
 * - `username`: le nom d'utilisateur choisi par l'utilisateur.
 * - `login`: l'adresse email de l'utilisateur.
 * - `pwd_hash`: le mot de passe de l'utilisateur, haché pour plus de sécurité.
 *
 * Chaque propriété est décorée avec les décorateurs TypeORM (`@PrimaryGeneratedColumn`, `@Column`),
 * qui indiquent comment ces propriétés doivent être traitées par TypeORM lors de l'interaction avec la base de données.
 *
 * Le modèle "User" peut être utilisé pour créer, lire, mettre à jour ou supprimer des utilisateurs dans la base de données.
 */

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number; // Le ! dit à TypeScript qu'on définira la variable plus tard, sinon il veut un constructeur ou une valeur par défaut

  @Column()
  username!: string;

  @Column()
  login!: string;

  @Column()
  pwd_hash!: string;
}
