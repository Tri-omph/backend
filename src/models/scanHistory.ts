import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './Customer'; // Assuming you already have a Customer entity

export enum ScanType {
  QUESTIONS = 'questions',
  AI = 'ai',
  BARCODE = 'barcode',
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
  scanType!: ScanType;

  @Column({ type: 'text', nullable: true })
  details!: string;

  @Column({ default: false })
  isValid!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
