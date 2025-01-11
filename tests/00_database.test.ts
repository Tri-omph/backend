import bcrypt from 'bcrypt';

import { Customer } from '../src/models/Customer';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { resetDataSource } from './utils';

beforeAll(async () => {
  await resetDataSource();
});

describe('Database Seeding', () => {
  it("devrait ajouter le mainadmin s'il n'existe pas", async () => {
    const customerRepository = AppDataSource.getRepository(Customer);

    const admin = await customerRepository.findOneBy({
      login: process.env.MAIN_ADMIN_EMAIL ?? 'admin@example.com',
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

  it('ne devrait pas créer de deuxième main admin', async () => {
    const customerRepository = AppDataSource.getRepository(Customer);

    await seedDatabase(AppDataSource);

    const admins = await customerRepository.find({
      where: { login: process.env.MAIN_ADMIN_EMAIL ?? 'admin@example.com' },
    });
    expect(admins).toHaveLength(1);
  });
});
