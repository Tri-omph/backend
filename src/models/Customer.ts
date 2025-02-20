import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { ScanHistory } from './scanHistory';
import { Warning } from './Warning';

@Entity()
export class Customer extends User {
  @Column({ default: 0 })
  points!: number;

  @Column({ type: 'bool' })
  saveImage!: boolean;

  @OneToMany(() => ScanHistory, (scanHistory) => scanHistory.customer)
  scanHistory!: ScanHistory[];

  @OneToMany(() => Warning, (warning) => warning.customer)
  warnings!: Warning[];
}
