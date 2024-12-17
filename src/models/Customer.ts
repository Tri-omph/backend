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

  @Column({ default: 0 })
  points!: number;
}
