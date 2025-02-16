import { Entity, Column } from 'typeorm';
import { User } from './User';

@Entity()
export class Customer extends User {
  @Column({ default: 0 })
  points!: number;

  @Column({ type: 'bool' })
  saveImage!: boolean;
}
