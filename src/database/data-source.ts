import { DataSource } from 'typeorm';
import { Customer } from '../models/Customer';
import { ScanHistory } from '../models/scanHistory';
import * as mysql from 'mysql2';

let AppDataSource: DataSource;

if (process.env.NODE_ENV === 'test') {
  const TestDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Customer, ScanHistory],
    synchronize: true,
    logging: false,
  });
  AppDataSource = TestDataSource;
} else {
  const ProductionDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306'), // default for MySQL
    username: process.env.DB_USERNAME ?? 'usrn',
    password: process.env.DB_PWD ?? '',
    database: process.env.DB_NAME ?? 'test_db',
    synchronize: true, // TODO Fix CI with synchronize false
    logging: true,
    entities: [Customer, ScanHistory],
    migrations: ['src/database/migrations/*.ts'],
    driver: mysql,
    extra: {
      authPlugins: {
        mysql_clear_password: () => () => Buffer.from(process.env.DB_PWD ?? ''),
      },
    },
  });
  AppDataSource = ProductionDataSource;
}

export { AppDataSource };
