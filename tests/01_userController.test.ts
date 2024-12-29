import request from 'supertest';

import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { generateExpiredJWT, resetDataSource } from './utils';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';

// TODO: ajouter les messages d'erreur dans tous les expect(response.body).toHaveProperty('message', '...');
// Mettre à jour le openapi.yaml et le ENDPOINTS.md en fonction

let i = 0;
const generateUser = () => {
  return {
    username: `testUser${i}`,
    password: 'Pwd!5678',
    email: `testuser${i++}@example.com`,
  };
};

const mainadminCreds = {
  username: 'mainadmin',
  password: process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
};

beforeAll(async () => {
  await resetDataSource();
});

describe('/users', () => {
  describe('POST /users', () => {
    beforeEach(async () => {
      const customerRepository = AppDataSource.getRepository(Customer);

      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    });

    it("200 si l'entrée est valide, devrait créer un utilisateur avec tous les champs définis et correctement initialisés", async () => {
      const user = generateUser();
      const response = await request(app).post('/api/v1/users').send(user);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');

      const customerRepository = AppDataSource.getRepository(Customer);
      const dbUser = await customerRepository.findOneBy({
        username: user.username,
      });
      expect(dbUser).not.toBeNull();
      if (!dbUser) return;

      expect(dbUser.id).not.toBeNull();
      expect(dbUser.username).toBe(user.username);
      expect(dbUser.admin).toBeFalsy();
      expect(dbUser.login).toBe(user.email);
      expect(dbUser.points).toBe(0);
      expect(dbUser.restricted).toBeFalsy();
      expect(dbUser.pwd_hash).not.toHaveLength(0);
    });

    describe('400 Bad Request', () => {
      it("400 s'il manque le mail", async () => {
        const { username, password } = generateUser();
        const response = await request(app)
          .post('/api/v1/users')
          .send({ username, password });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it("400 s'il manque le pseudonyme", async () => {
        const { email, password } = generateUser();
        const response = await request(app)
          .post('/api/v1/users')
          .send({ email, password });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it("400 s'il manque le mot de passe", async () => {
        const { username, email } = generateUser();
        const response = await request(app)
          .post('/api/v1/users')
          .send({ username, email });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('409 Conflict', () => {
      it('409 si le mail est déjà utilisé', async () => {
        const user = generateUser();

        await request(app).post('/api/v1/users').send(user);
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: user.email });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
      });

      it('409 si le mail est déjà utilisé (avec casse différente)', async () => {
        const user = generateUser();

        await request(app).post('/api/v1/users').send(user);
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: user.email.toUpperCase() });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
      });

      it('409 si le pseudonyme est déjà utilisé', async () => {
        const user = generateUser();

        await request(app).post('/api/v1/users').send(user);
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), username: user.username });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
      });

      it('409 si le pseudonyme est déjà utilisé (avec casse différente)', async () => {
        const user = generateUser();

        await request(app).post('/api/v1/users').send(user);
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), username: user.username.toUpperCase() });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('422 Unprocessable Entity', () => {
      it('422 si le mail est mal formaté', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: 'notanemail' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'Entrée invalide');
      });

      it('422 si le pseudonyme est vide', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), username: '' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si le mot de passe fait moins de 8 caractères', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Sh0rt!!' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it("422 si le mot de passe n'a pas de chiffres", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Password!!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it("422 si le mot de passe n'a pas de majuscule", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'password0!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it("422 si le mot de passe n'a pas de minuscule", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'PASSWORD0!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it("422 si le mot de passe n'a pas de caractère spécial", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Password12' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('POST /users/auth', () => {
    let u: {
        username: string;
        password: string;
        email: string;
      },
      username: string,
      password: string,
      user: {
        username: string;
        password: string;
      };

    beforeAll(async () => {
      u = generateUser();
      username = u.username;
      password = u.password;
      user = { username, password };

      const customerRepository = AppDataSource.getRepository(Customer);

      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      await request(app).post('/api/v1/users').send(u);
    });

    describe('200 OK', () => {
      it("200 si l'entrée est valide, devrait renvoyer un token (utilisateur)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(user);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });

      it("200 si l'entrée est valide, devrait renvoyer un token (mainadmin)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(mainadminCreds);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });
    });

    describe('400 Bad Request', () => {
      it("400 s'il manque le pseudonyme", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ password });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it("400 s'il manque le mot de passe", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ username });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('401 Unauthorized', () => {
      it("401 si le pseudonyme n'existe pas", async () => {
        const response = await request(app).post('/api/v1/users/auth').send({
          username:
            'thisUsernameAbsolutelyCannotExistInThisDatabaseOtherwiseICry',
          password,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('401 si le couple pseudonyme-mdp est faux', async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ username, password: 'wrongPassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('/users/me', () => {
    describe('GET /users/me', () => {
      let user: { username: string; password: string; email: string },
        userId: number,
        token: string,
        mainadminToken: string;

      beforeAll(async () => {
        user = generateUser();
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.clear();

        await seedDatabase(AppDataSource);
        await request(app).post('/api/v1/users').send(user);

        const userData = await customerRepository.findOneBy({
          login: user.email,
        });
        if (userData) userId = userData.id;

        const res = await request(app)
          .post('/api/v1/users/auth')
          .send({ username: user.username, password: user.password });
        token = res.body.token;

        const res2 = await request(app)
          .post('/api/v1/users/auth')
          .send(mainadminCreds);
        mainadminToken = res2.body.token;
      });

      describe('200 OK', () => {
        it("200 si l'entrée est valide, renvoie les informations utilisateur (utilisateur)", async () => {
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('id');
          expect(response.body.id).not.toBeNaN();
          expect(response.body).toHaveProperty('username', user.username);
          expect(response.body).toHaveProperty('login', user.email);
          expect(response.body).toHaveProperty('pwd_hash');
          expect(response.body).toHaveProperty('restricted');
          expect(response.body.restricted).toBeFalsy();
          expect(response.body).toHaveProperty('admin');
          expect(response.body.admin).toBeFalsy();
          expect(response.body).toHaveProperty('points', 0);
        });

        it("200 si l'entrée est valide, renvoie les informations utilisateur (mainadmin)", async () => {
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${mainadminToken}`);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('id');
          expect(response.body.id).not.toBeNaN();
          expect(response.body).toHaveProperty('username', 'mainadmin');
          expect(response.body).toHaveProperty('login', 'admin@example.com');
          expect(response.body).toHaveProperty('pwd_hash');
          expect(response.body).toHaveProperty('restricted');
          expect(response.body.restricted).toBeFalsy();
          expect(response.body).toHaveProperty('admin');
          expect(response.body.admin).toBeTruthy();
          expect(response.body).toHaveProperty('points', 0);
        });
      });

      describe('401 Unauthorized', () => {
        it("401 s'il manque le token", async () => {
          const response = await request(app).get('/api/v1/users/me');

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });

        it('401 si le token est faux', async () => {
          const invalidToken = 'invalid.token.here';
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${invalidToken}`);

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });

        it('401 si le token est valide mais expiré', async () => {
          const expiredToken = generateExpiredJWT(userId, user.username);
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${expiredToken}`);

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });
      });
    });

    describe('PATCH /users/me', () => {
      let user: { username: string; password: string; email: string },
        username: string,
        email: string,
        username2: string,
        email2: string,
        password: string,
        token: string,
        id: number;

      beforeAll(async () => {
        user = generateUser();
        username = user.username;
        email = user.email;
        password = user.password;

        const user2 = generateUser();
        username2 = user2.username;
        email2 = user2.email;

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.clear();

        await seedDatabase(AppDataSource);
        await request(app).post('/api/v1/users').send(user);
        await request(app).post('/api/v1/users').send(user2);

        const userData = await customerRepository.findBy({
          username,
          login: email,
        });
        id = userData[0].id;

        const res = await request(app)
          .post('/api/v1/users/auth')
          .send({ username, password });
        token = res.body.token;
      });

      describe('200 OK', () => {
        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username)", async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: newUsername });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('message');

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(oldUserData).toHaveLength(0);

          username = newUsername;
          const userData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(userData).toHaveLength(1);
          expect(userData[0].id).toBe(id);
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (mail)", async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: newEmail });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('message');

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(oldUserData).toHaveLength(0);

          email = newEmail;
          const userData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(userData).toHaveLength(1);
          expect(userData[0].id).toBe(id);
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username & mail)", async () => {
          const { username: newUsername, email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: newUsername, email: newEmail });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('message');

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(oldUserData).toHaveLength(0);

          username = newUsername;
          email = newEmail;
          const userData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(userData).toHaveLength(1);
          expect(userData[0].id).toBe(id);
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username & ancien mail)", async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: newUsername, email });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('message');

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(oldUserData).toHaveLength(0);

          username = newUsername;
          const userData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(userData).toHaveLength(1);
          expect(userData[0].id).toBe(id);
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (ancien username & mail)", async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username, email: newEmail });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('message');

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(oldUserData).toHaveLength(0);

          email = newEmail;
          const userData = await customerRepository.findBy({
            username,
            login: email,
          });
          expect(userData).toHaveLength(1);
          expect(userData[0].id).toBe(id);
        });
      });

      describe('400 Bad Request', () => {
        it("400 aucun paramètre n'est fourni", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({});

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('message');
        });

        it("400 si le format de l'email est invalide", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'invalid-email' });

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('message');
        });

        it("400 si le nom d'utilisateur est vide", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: '' });

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('message');
        });
      });

      describe('401 Unauthorized', () => {
        it('401 si le token est manquant', async () => {
          const { username: newUsername, email: newEmail } = generateUser();
          const response = await request(app).patch('/api/v1/users/me').send({
            username: newUsername,
            email: newEmail,
          });

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });

        it('401 si le token est invalide', async () => {
          const { username: newUsername, email: newEmail } = generateUser();
          const invalidToken = 'invalid.token.here';
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${invalidToken}`)
            .send({
              username: newUsername,
              email: newEmail,
            });

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });

        it('401 si le token a expiré', async () => {
          const { username: newUsername, email: newEmail } = generateUser();
          const expiredToken = await generateExpiredJWT(id, username);
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${expiredToken}`)
            .send({
              username: newUsername,
              email: newEmail,
            });

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message');
        });
      });

      describe('409 Conflict', () => {
        it('409 le mail est déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: email2 });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });

        it('409 le pseudonyme est déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: username2 });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });

        it('409 le mail et le pseudonyme sont déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: email2, username: username2 });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });

        it('409 le mail est déjà pris, malgré un pseudonyme valide', async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: email2, username: newUsername });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });

        it('409 le pseudonyme est déjà pris, malgré un mail valide', async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: username2, email: newEmail });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });
      });
    });
  });

  describe('GET /users/info/:id', () => {
    let user: { username: string; password: string; email: string },
      adminToken: string,
      userToken: string,
      id: number;

    beforeAll(async () => {
      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      user = generateUser();
      const userData = await customerRepository.save(user);
      id = userData.id;

      const adminAuthResponse = await request(app)
        .post('/api/v1/users/auth')
        .send(mainadminCreds);
      adminToken = adminAuthResponse.body.token;

      const userAuthResponse = await request(app)
        .post('/api/v1/users/auth')
        .send({ username: user.username, password: user.password });
      userToken = userAuthResponse.body.token;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    });

    it("200 si le token admin est valide et l'ID existe, devrait retourner les informations de l'utilisateur", async () => {
      const response = await request(app)
        .get(`/api/v1/users/info/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.username).toBe(user.username);
      expect(response.body.email).toBe(user.email);
      expect(response.body.points).toBe(0);
      expect(response.body.restricted).toBeFalsy();
      expect(response.body.admin).toBeFalsy();
    });

    it("400 si l'ID est manquant", async () => {
      const response = await request(app)
        .get('/api/v1/users/info')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    describe('401 Unauthorized', () => {
      it('401 si le token est manquant', async () => {
        const response = await request(app).get(`/api/v1/users/info/${id}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .get(`/api/v1/users/info/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    it("403 si un utilisateur sans droits admin tente d'accéder aux informations", async () => {
      const response = await request(app)
        .get(`/api/v1/users/info/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .get('/api/v1/users/info/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it("422 si l'ID n'est pas numérique", async () => {
      const response = await request(app)
        .get('/api/v1/users/info/notanumber')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users/find/', () => {
    let userToken: string,
      adminToken: string,
      mainadminToken: string,
      userId: number,
      user: { username: string; password: string; email: string },
      admin: { username: string; password: string; email: string };

    beforeAll(async () => {
      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      user = generateUser();
      admin = generateUser();

      await request(app).post('/api/v1/users').send(user);
      await request(app).post('/api/v1/users').send(admin);

      const userData = await customerRepository.findOneBy({
        username: user.username,
      });

      const adminData = await customerRepository.findOneBy({
        username: admin.username,
      });
      if (!userData || !adminData) return;

      userId = userData.id;
      await customerRepository.update({ id: userData.id }, { points: 80 });
      await customerRepository.update({ id: adminData.id }, { admin: true });

      const userAuthResponse = await request(app)
        .post('/api/v1/users/auth')
        .send({ username: user.username, password: user.password });
      userToken = userAuthResponse.body.token;

      const adminAuthResponse = await request(app)
        .post('/api/v1/users/auth')
        .send({ username: admin.username, password: admin.password });
      adminToken = adminAuthResponse.body.token;

      const mainadminAuthResponse = await request(app)
        .post('/api/v1/users/auth')
        .send(mainadminCreds);
      mainadminToken = mainadminAuthResponse.body.token;

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    });

    describe('200 OK', () => {
      it('200 si les filtres sont vides, et les droits suffisants (mainadmin), devrait renvoyer tous les utilisateurs', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({});

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (id)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ id: 0 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe(0);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (username)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ username: 'testUser' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (points)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: 50, pointsMax: 200 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].username).toBe(user.username);
        expect(response.body[0].points).toBe(80);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (login)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ login: 'testuser' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (restricted)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ restricted: false });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
      });

      it('200 si les filtres sont valides, et les droits suffisants (mainadmin), devrait renvoyer les utilisateurs correspondant (admin)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ admin: true });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });

      it('200 si les filtres sont vides, et les droits suffisants (admin), devrait renvoyer tous les utilisateurs', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
      });

      it('200 si les filtres sont valides, et les droits suffisants (admin), devrait renvoyer les utilisateurs correspondant (id)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ id: 0 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe(0);
      });
    });

    describe('401 Unauthorized', () => {
      it('401 si le token est manquant', async () => {
        const response = await request(app).post('/api/v1/users/find/').send({
          pointsMin: 50,
          pointsMax: 200,
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${invalidToken}`)
          .send({
            pointsMin: 50,
            pointsMax: 200,
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('401 si le token est expiré', async () => {
        const token = generateExpiredJWT(userId, user.username);
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${token}`)
          .send({
            pointsMin: 50,
            pointsMax: 200,
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('403 Forbidden', () => {
      it('403 si un utilisateur sans droits admin tente de chercher des utilisateurs', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            pointsMin: 50,
            pointsMax: 200,
          });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('422 Unprocessable Entity', () => {
      it('422 si les filtres sont invalides (id non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ id: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (pointsMin non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (pointsMax non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMax: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (pointsMin < 0)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: -10 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (pointsMin > pointsMax)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: 100, pointsMax: 10 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (restricted non booléen)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ restricted: 100 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });

      it('422 si les filtres sont invalides (admin non booléen)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ admin: 100 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
