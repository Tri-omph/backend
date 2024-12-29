import bcrypt from 'bcrypt';

import { Customer } from '../src/models/Customer';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { resetDataSource } from './utils';

beforeAll(async () => {
  await resetDataSource();
});

describe('Database Seeding', () => {
  it('should create the mainadmin user if it does not exist', async () => {
    const customerRepository = AppDataSource.getRepository(Customer);

    const admin = await customerRepository.findOneBy({
      login: 'admin@example.com',
    });

    expect(admin).not.toBeNull();
    if (!admin) return;

    expect(admin.username).toBe('mainadmin');
    expect(admin.admin).toBe(true);

    const isPasswordValid = await bcrypt.compare(
      process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
      admin.pwd_hash
    );
    expect(isPasswordValid).toBe(true);
  });

  it('should not create a duplicate mainadmin user if already seeded', async () => {
    const customerRepository = AppDataSource.getRepository(Customer);

    await seedDatabase(AppDataSource);

    const admins = await customerRepository.find({
      where: { login: 'admin@example.com' },
    });
    expect(admins).toHaveLength(1);
  });
});
