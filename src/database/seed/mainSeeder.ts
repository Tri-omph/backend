import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';

import { Customer } from '../../models/Customer';

const seedDatabase = async (dataSource: DataSource) => {
  const customerRepository = dataSource.getRepository(Customer);

  const login = process.env.MAIN_ADMIN_EMAIL ?? 'admin@example.com';

  const existingAdmin = await customerRepository.findOneBy({ login });

  if (!existingAdmin) {
    const mainAdmin: Customer = {
      id: 0,
      username: 'mainadmin',
      login,
      pwd_hash: await bcrypt.hash(
        process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
        10 // Sel pour rendre le hachage encore plus sécurisé
      ),
      restricted: false,
      admin: true,
      saveImage: true,
      points: 0,
      scanHistory: [],
      warnings: [],
    };

    const admin = customerRepository.create(mainAdmin);
    await customerRepository.save(admin);

    if (process.env.NODE_ENV !== 'test') console.log('mainadmin user created.');
  }
};

export { seedDatabase };
