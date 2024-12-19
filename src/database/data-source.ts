import { DataSource } from 'typeorm';
import { Customer } from '../models/Customer';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'), // défaut pour MySQL
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PWD || '',
  database: process.env.DB_NAME || 'tri_omph',
  synchronize: true,
  logging: true,
  entities: [Customer],
  migrations: ['src/database/migrations/*.ts'],
  driver: require('mysql2'),
});
