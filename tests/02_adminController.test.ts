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
    let user: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user2: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
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

    it("200 si le token admin est valide et l'ID existe, devrait donner le statut admin à l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/promote/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User promoted to admin successfully'
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

    describe('400 Bad Request', () => {
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

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).patch(
          `/api/v1/admin/promote/${id}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .patch(`/api/v1/admin/promote/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(0, true);
        const response = await request(app)
          .patch(`/api/v1/admin/promote/${id}`)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });

    it('403 si un utilisateur sans droits admin tente de promouvoir un utilisateur', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/promote/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/promote/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("409 si l'utilisateur a déjà les droits admin", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/promote/${id2}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        'This user is already an admin'
      );
    });
  });

  describe('PATCH /restrict/:id', () => {
    let user: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user2: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user3: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      userToken: string,
      adminToken: string,
      mainadminToken: string,
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
      mainadminToken = generateJWT(0, true);
    });

    it("200 si le token admin est valide et l'ID existe, devrait restreindre l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/restrict/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User restricted successfully'
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

    describe('400 Bad Request', () => {
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

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).patch(
          `/api/v1/admin/restrict/${id}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .patch(`/api/v1/admin/restrict/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(0, true);
        const response = await request(app)
          .patch(`/api/v1/admin/restrict/${id}`)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });

    it('403 si un utilisateur sans droits admin tente de promouvoir un utilisateur', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/restrict/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/restrict/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    describe('409 Conflict', () => {
      it("409 si l'utilisateur a les droits admin", async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/restrict/${id2}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'Cannot restrict an admin. Demote first.'
        );
      });

      it('409 si le mainadmin tente de restreindre un utilisateur aux droits admin', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/restrict/${id2}`)
          .set('Authorization', `Bearer ${mainadminToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'Cannot restrict an admin. Demote first.'
        );
      });

      it("409 si l'utilisateur est déjà restreint", async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/restrict/${id3}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'This user is already restricted'
        );
      });
    });
  });

  describe('PATCH /free/:id', () => {
    let user: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user2: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user3: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      userToken: string,
      adminToken: string,
      id: number,
      id2: number,
      id3: number,
      checkUser: (c: Customer) => Promise<boolean>;

    beforeAll(async () => {
      user = generateUser(false, true);
      const custo = await generateCustomer(user);

      user2 = generateUser(true, false);
      const admin = await generateCustomer(user2);

      user3 = generateUser(false, false);
      const notrestrict = await generateCustomer(user3);

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
      await customerRepository.save(notrestrict);

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

      const notrestrictData = await customerRepository.findOneBy({
        username: user3.username,
      });
      if (!notrestrictData) return;
      id3 = notrestrictData.id;

      userToken = generateJWT(id, userData.admin);
      adminToken = generateJWT(id2, adminData.admin);
    });

    it("200 si le token admin est valide et l'ID existe, devrait enlever la restriction de l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/free/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User freed from restriction successfully'
      );

      const customerRepository = AppDataSource.getRepository(Customer);
      const oldUserData = await customerRepository.findBy({
        username: user.username,
        restricted: true,
      });
      expect(oldUserData).toHaveLength(0);

      const userData = await customerRepository.findBy({
        username: user.username,
      });
      expect(userData).toHaveLength(1);
      expect(!userData[0].restricted).toBeTruthy();
    });

    describe('400 Bad Request', () => {
      it("400 si l'ID n'est pas numérique", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/free/notanumber')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas entier naturel", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/free/1.5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });
    });

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).patch(`/api/v1/admin/free/${id}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .patch(`/api/v1/admin/free/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(0, true);
        const response = await request(app)
          .patch(`/api/v1/admin/free/${id}`)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });

    it('403 si un utilisateur sans droits admin tente de promouvoir un utilisateur', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/free/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/free/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("409 si l'utilisateur n'est pas restreint", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/free/${id3}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        'This user is not restricted'
      );
    });
  });

  describe('PATCH /demote/:id', () => {
    let user: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      user2: {
        username: string;
        password: string;
        email: string;
        admin: boolean;
        restricted: boolean;
      },
      userToken: string,
      adminToken: string,
      mainadminToken: string,
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
      mainadminToken = generateJWT(0, true);
    });

    it("200 si le token mainadmin est valide et l'ID existe, devrait enlever le statut admin a l'utilisateur", async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/demote/${id2}`)
        .set('Authorization', `Bearer ${mainadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User demoted successfully'
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
      expect(!userData[0].admin).toBeTruthy();
    });

    describe('400 Bad Request', () => {
      it("400 si l'ID n'est pas numérique", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/demote/notanumber')
          .set('Authorization', `Bearer ${mainadminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });

      it("400 si l'ID n'est pas entier naturel", async () => {
        const response = await request(app)
          .patch('/api/v1/admin/demote/1.5')
          .set('Authorization', `Bearer ${mainadminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Invalid or missing ID parameter'
        );
      });
    });

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).patch(`/api/v1/admin/demote/${id}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(0, true);
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${id}`)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });

    describe('403 Forbidden', () => {
      it('403 si un utilisateur sans droits mainadmin (utilisateur) tente de promouvoir un utilisateur', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
      });

      it('403 si un utilisateur sans droits mainadmin (admin) tente de promouvoir un utilisateur', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
      });
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .patch('/api/v1/admin/demote/999999')
        .set('Authorization', `Bearer ${mainadminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    describe('409 Conflict', () => {
      it("409 si l'utilisateur n'a pas de droits admin", async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${id}`)
          .set('Authorization', `Bearer ${mainadminToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'This user is not an admin'
        );
      });

      it("409 si l'utilisateur est le mainadmin", async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/demote/${0}`)
          .set('Authorization', `Bearer ${mainadminToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'This user is not an admin'
        );
      });
    });
  });
});
