import { DataSource } from 'typeorm';
import { Customer } from '../models/Customer';

let AppDataSource: DataSource;

if (process.env.NODE_ENV === 'test') {
  const TestDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Customer],
    synchronize: true,
    logging: false,
  });
  AppDataSource = TestDataSource;
} else {
  const ProductionDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306'), // défaut pour MySQL
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PWD ?? '',
    database: process.env.DB_NAME ?? 'tri_omph',
    synchronize: false,
    logging: true,
    entities: [Customer],
    migrations: ['src/database/migrations/*.ts'],
    driver: require('mysql2'),
  });
  AppDataSource = ProductionDataSource;
}

export { AppDataSource };
