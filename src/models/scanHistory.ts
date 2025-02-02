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

  // TODO: We need to find the exact form of the enum before using it
  @Column({
    type: 'text',
    //type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    //enum: TypeBin,
  })
  poubelle!: string; //TypeBin;

  // TODO: We need to find the exact form of the enum before using it
  @Column({
    type: 'text',
    //type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    //enum: TypeDisposable,
  })
  type!: string; //TypeDisposable;

  @CreateDateColumn()
  date!: Date;
}
