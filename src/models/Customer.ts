import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { TypeBin, TypeDisposable } from '../types/enums';
import { ScanHistory } from './scanHistory';

@Entity()
export class Customer extends User {
  @Column({ default: 0 })
  points!: number;

  @Column('json', { default: [] })
  bins!: { bin: TypeBin; disposable: TypeDisposable[] }[];

  @Column({ type: 'bool' })
  saveImage!: boolean;

  @OneToMany(() => ScanHistory, (scanHistory) => scanHistory.customer)
  scanHistory!: ScanHistory[];
}


