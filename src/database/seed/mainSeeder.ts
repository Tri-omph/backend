import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';

import { Customer } from '../../models/Customer';
import { GameType } from '../../types/enums';

const seedDatabase = async (dataSource: DataSource) => {
  const customerRepository = dataSource.getRepository(Customer);

  const login = 'admin@example.com';

  const existingAdmin = await customerRepository.findOneBy({ login });

  if (!existingAdmin) {
    const mainAdmin: Customer = {
      id: 0,
      username: 'mainadmin',
      login,
      pwd_hash: await bcrypt.hash(
        process.env.MAIN_ADMIN_PWD || 'mot_de_passe_pas_sécurisé_du_tout',
        10 // Sel pour rendre le hachage encore plus sécurisé
      ),
      gameType: GameType.MONSTER,
      restricted: false,
    };

    const admin = customerRepository.create(mainAdmin);
    await customerRepository.save(admin);

    console.log('mainadmin user created.');
  }
};

export { seedDatabase };
