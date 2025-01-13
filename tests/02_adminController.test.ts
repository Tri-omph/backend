import request from 'supertest';
import { hash, compare } from 'bcrypt';

import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { generateExpiredJWT, resetDataSource } from './utils';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { generateJWT } from '../src/utils';

let i = 0;
const generateUser = (statusAdmin: boolean, restrict: boolean) => {
  return {
    username: `testAdmin${i}`,
    password: 'Pwd!1234',
    email: `testadmin${i++}@example.com`,
    admin: statusAdmin,
    restricted: restrict,
  };
};

const generateCustomer = async (user: {
  username: string;
  password: string;
  email: string;
  admin: boolean;
  restricted: boolean;
}): Promise<Partial<Customer>> => {
  const { username, password, email, admin, restricted } = user;
  return {
    username,
    pwd_hash: await hash(password, 10),
    login: email.toLowerCase(),
    admin,
    restricted,
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
    let user: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        user2: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        userToken: string,
        adminToken: string,
        id: number,
        id2: number,
        
        checkUser: (c: Customer) => Promise<boolean>;
  
    beforeAll(async () => {
      user = generateUser(false, false);
      const custo = await generateCustomer(user);

      user2 = generateUser(true, false);
      const admin = await generateCustomer(user2);

      checkUser = async (c: Customer) =>
          c.username === user.username &&
          c.login === user.password &&
          (await compare(user.password, c.pwd_hash)) &&
          c.id === id;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();

      await seedDatabase(AppDataSource);
      await customerRepository.save(custo);
      await customerRepository.save(admin);

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

    it("200 si le token admin est valide et l'ID existe, devrait donner le statut admin a l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/promote/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        "User promoted to admin successfully"
      );

      const customerRepository = AppDataSource.getRepository(Customer);
      const oldUserData = await customerRepository.findBy({
        username: user.username,
        admin: false,
      });
      expect(oldUserData).toHaveLength(0);

      const userData = await customerRepository.findBy({
        username: user.username,
      });
      expect(userData).toHaveLength(1);
      expect(userData[0].admin).toBeTruthy();
    });

    describe("400 Bad Request", () => {
      it("400 si l'ID est vide", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/promote/')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas numérique", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/promote/notanumber')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas entier naturel", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/promote/1.5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/promote/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'User not found'
      );
    });

    it("409 si l'utilisateur a déjà les droits admin", async () => {
      const response = await request(app)
      .patch(`/api/v1/admin/promote/${id2}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        "This user is already an admin"
      );
    });
   
  });

  describe('PATCH /restrict/:id', () => {
    let user: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        user2: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        user3: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        userToken: string,
        adminToken: string,
        id: number,
        id2: number,
        id3: number,
        
        checkUser: (c: Customer) => Promise<boolean>;
  
    beforeAll(async () => {
      user = generateUser(false, false);
      const custo = await generateCustomer(user);

      user2 = generateUser(true, false);
      const admin = await generateCustomer(user2);

      user3 = generateUser(false, true);
      const restrict = await generateCustomer(user3);

      checkUser = async (c: Customer) =>
          c.username === user.username &&
          c.login === user.password &&
          (await compare(user.password, c.pwd_hash)) &&
          c.id === id;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();

      await seedDatabase(AppDataSource);
      await customerRepository.save(custo);
      await customerRepository.save(admin);
      await customerRepository.save(restrict);

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

      const restrictData = await customerRepository.findOneBy({
        username: user3.username,
      });
      if (!restrictData) return;
      id3 = restrictData.id;


      userToken = generateJWT(id, userData.admin);
      adminToken = generateJWT(id2, adminData.admin);
    });

    it("200 si le token admin est valide et l'ID existe, devrait restreindre l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/restrict/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        "User restricted successfully"
      );

      const customerRepository = AppDataSource.getRepository(Customer);
      const oldUserData = await customerRepository.findBy({
        username: user.username,
        restricted: false,
      });
      expect(oldUserData).toHaveLength(0);

      const userData = await customerRepository.findBy({
        username: user.username,
      });
      expect(userData).toHaveLength(1);
      expect(userData[0].restricted).toBeTruthy();
    });

    describe("400 Bad Request", () => {
      it("400 si l'ID est vide", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/restrict/')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas numérique", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/restrict/notanumber')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas entier naturel", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/restrict/1.5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/restrict/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'User not found'
      );
    });

    describe("409 Conflict", () => {
      it("409 si l'utilisateur a les droits admin", async () => {
        const response = await request(app)
        .patch(`/api/v1/admin/restrict/${id2}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          "Cannot restrict an admin. Demote first."
        );
      });

      it("409 si l'utilisateur est déjà restreint", async () => {
        const response = await request(app)
        .patch(`/api/v1/admin/restrict/${id3}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          "This user is already restricted"
        );
      });
    });
    
  });

  describe('PATCH /free/:id', () => {

  });

  describe('PATCH /demote/:id', () => {
    let user: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        user2: { username: string; password: string; email: string; admin: boolean, restricted: boolean },
        userToken: string,
        adminToken: string,
        id: number,
        id2: number,
        
        checkUser: (c: Customer) => Promise<boolean>;
  
    beforeAll(async () => {
      user = generateUser(false, false);
      const custo = await generateCustomer(user);

      user2 = generateUser(true, false);
      const admin = await generateCustomer(user2);

      checkUser = async (c: Customer) =>
          c.username === user.username &&
          c.login === user.password &&
          (await compare(user.password, c.pwd_hash)) &&
          c.id === id;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();

      await seedDatabase(AppDataSource);
      await customerRepository.save(custo);
      await customerRepository.save(admin);

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

    it("200 si le token admin est valide et l'ID existe, devrait enlever le statut admin a l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/demote/${id2}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        "User demoted to admin successfully"
      );

      const customerRepository = AppDataSource.getRepository(Customer);
      const oldUserData = await customerRepository.findBy({
        username: user.username,
        admin: true,
      });
      expect(oldUserData).toHaveLength(0);

      const userData = await customerRepository.findBy({
        username: user.username,
      });
      expect(userData).toHaveLength(1);
      expect(!(userData[0].admin)).toBeTruthy();
    });

    describe("400 Bad Request", () => {
      it("400 si l'ID est vide", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/demote/')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas numérique", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/demote/notanumber')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas entier naturel", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/demote/1.5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/demote/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'User not found'
      );
    });

    it("409 si l'utilisateur n'a pas de droits admin", async () => {
      const response = await request(app)
      .patch(`/api/v1/admin/demote/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        "This user is not an admin"
      );
    });
   
  });

});



