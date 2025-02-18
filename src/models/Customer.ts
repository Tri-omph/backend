import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { ScanHistory } from './scanHistory';

@Entity()
export class Customer extends User {
  @Column({ default: 0 })
  points!: number;

  @Column({ type: 'bool' })
  saveImage!: boolean;

  @OneToMany(() => ScanHistory, (scanHistory) => scanHistory.customer)
  scanHistory!: ScanHistory[];
}
