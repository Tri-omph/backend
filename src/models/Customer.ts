import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { ScanHistory } from './scanHistory';

@Entity()
export class Customer extends User {
  @Column({ default: 0 })
  points!: number;

  @OneToMany(() => ScanHistory, (scanHistory) => scanHistory.customer)
  scanHistory!: ScanHistory[];
}
