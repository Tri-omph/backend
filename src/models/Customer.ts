import { Entity, Column } from 'typeorm';
import { User } from './User';
import { GameType } from '../types/enums';

@Entity()
export class Customer extends User {
  @Column({
    type: 'enum',
    enum: GameType,
    default: GameType.MONSTER,
  })
  gameType!: GameType;

  // À changer pour implémenter un système de point "digeste" pour la BDD (donc pas un JSON)
  // @Column()
  // points: Map<TypeDisposable, number> = new Map();
}
