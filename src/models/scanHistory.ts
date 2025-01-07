import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { TypeBin } from '../types/enums';

export enum ScanType {
  QUESTIONS = 'Questions',
  AI = 'IA',
  BARCODE = 'Barcode',
}

@Entity()
export class ScanHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, (customer) => customer.scanHistory, {
    onDelete: 'CASCADE',
  })
  customer!: Customer;

  @Column({ type: 'enum', enum: ScanType })
  method!: ScanType;

  @Column({ default: false })
  isValid!: boolean;

  @Column({ type: 'enum', enum: TypeBin })
  poubelle!: TypeBin;

  @CreateDateColumn()
  date!: Date;
}
