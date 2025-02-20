import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';

@Entity()
export class Warning {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, (customer) => customer.warnings)
  customer!: Customer;

  @Column()
  barcode!: string;

  @Column('int', { default: 0 }) // Ajout du champ scanCount
  scanCount!: number; // Nombre de fois que le barcode durant delta t

  @CreateDateColumn()
  createdAt!: Date;
}
