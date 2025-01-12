import request from 'supertest';
import { hash, compare } from 'bcrypt';

import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { generateExpiredJWT, resetDataSource } from './utils';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { generateJWT } from '../src/utils';

let i = 0;
const generateUser = (statusAdmin: boolean) => {
  return {
    username: `testAdmin${i}`,
    admin: statusAdmin,
  };
};

const generateCustomer = async (user: {
  username: string;
  admin: boolean;
}): Promise<Partial<Customer>> => {
  const { username, admin } = user;
  return {
    username,
    admin,
  };
};

/*// De quoi se connecter au main admin, avec pseudonyme
const mainadminCredsU = {
  login: 'mainadmin',
  password: process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
};

// De quoi se connecter au main admin, avec email
const mainadminCredsE = {
  login: process.env.MAIN_ADMIN_EMAIL ?? 'admin@example.com',
  password: process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
};*/

beforeAll(async () => {
  await resetDataSource();
});


describe('/admin', () => {
  describe('PATCH /promote/:id', () => {
    let user: { username: string; admin: boolean },
        user2: { username: string; admin: boolean },
        userToken: string,
        adminToken: string,
        id: number,
        id2: number,
        
        checkUser: (c: Customer) => Promise<boolean>;
  
    beforeAll(async () => {
      user = generateUser(false);
      const custo = await generateCustomer(user);

      user2 = generateUser(true);
      const admin = await generateCustomer(user2);

      checkUser = async (c: Customer) =>
        c.username === user.username &&
        c.id === id;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();

      await seedDatabase(AppDataSource);
      await customerRepository.save(custo);

      const userData = await customerRepository.findOneBy({
        username: user.username,
      });
      if (!userData) return;
      id = userData.id;

      const adminData = await customerRepository.findOneBy({
        username: user2.username,
      });
      if (!adminData) return;
      id2 = adminData.id;


      userToken = generateJWT(id, userData.admin);
      adminToken = generateJWT(id2, adminData.admin);
    });

    it("200 si l'utilisateur a été promu", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/promote/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        "User promoted to admin successfully."
      );

      const customerRepository = AppDataSource.getRepository(Customer);
      const oldUserData = await customerRepository.findBy({
        username: user.username,
        admin: false,
      });
      expect(oldUserData).toHaveLength(0);

      const userData = await customerRepository.findBy({
        username: user.username,
        admin: true,
      });
      expect(userData).toHaveLength(1);
      expect(checkUser(userData[0])).toBeTruthy();
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/promote/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'User not found.'
      );
    });

    it("409 si l'utilisateur a déjà les droits admin", async () => {
      const response = await request(app)
      .patch(`/api/v1/admin/promote/${id2}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        "This user is already an admin."
      );
    });

    
      
  });

  describe('PATCH /restrict/:id', () => {

  });

  describe('PATCH /free/:id', () => {

  });

  describe('PATCH /demote/:id', () => {

  });

});



