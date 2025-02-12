import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { ScanType, TypeBin, TypeDisposable } from '../types/enums';

@Entity()
export class ScanHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, (customer) => customer.scanHistory, {
    onDelete: 'CASCADE',
  })
  customer!: Customer;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: ScanType,
  })
  method!: ScanType;

  @Column({ default: false })
  isValid!: boolean;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: TypeBin,
  })
  poubelle!: TypeBin;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: TypeDisposable,
  })
  type!: TypeDisposable;

  @CreateDateColumn()
  date!: Date;

  @Column({ type: 'blob', nullable: true })
  image!: Buffer;
}
