import request from 'supertest';
import { hash, compare } from 'bcrypt';

import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { generateExpiredJWT, resetDataSource } from './utils';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { generateJWT } from '../src/utils';

let i = 0;
const generateUser = () => {
  return {
    username: `testUser${i}`,
    password: 'Pwd!5678',
    email: `testuser${i++}@example.com`,
  };
};

const generateCustomer = async (user: {
  username: string;
  password: string;
  email: string;
}): Promise<Partial<Customer>> => {
  const { username, password, email } = user;
  return {
    username,
    pwd_hash: await hash(password, 10),
    login: email.toLowerCase(),
  };
};

// De quoi se connecter au main admin, avec pseudonyme
const mainadminCredsU = {
  login: 'mainadmin',
  password: process.env.MAIN_ADMIN_PWD ?? 'mot_de_passe_pas_sécurisé_du_tout',
};

// De quoi se connecter au main admin, avec email
const mainadminCredsE = {
  login: process.env.MAIN_ADMIN_EMAIL ?? 'admin@example.com',
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

    it("201 si l'entrée est valide, devrait créer un utilisateur avec tous les champs définis et correctement initialisés", async () => {
      const user = generateUser();
      const response = await request(app).post('/api/v1/users').send(user);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'Utilisateur créé avec succès.'
      );
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
        expect(response.body).toHaveProperty(
          'message',
          'Tous les champs sont requis.'
        );
      });

      it("400 s'il manque le pseudonyme", async () => {
        const { email, password } = generateUser();
        const response = await request(app)
          .post('/api/v1/users')
          .send({ email, password });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Tous les champs sont requis.'
        );
      });

      it("400 s'il manque le mot de passe", async () => {
        const { username, email } = generateUser();
        const response = await request(app)
          .post('/api/v1/users')
          .send({ username, email });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Tous les champs sont requis.'
        );
      });
    });

    describe('409 Conflict', () => {
      it('409 si le mail est déjà utilisé', async () => {
        const custo = await generateCustomer(generateUser());

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.save(custo);

        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: custo.login });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', "L'email existe déjà.");
      });

      it('409 si le mail est déjà utilisé (avec casse différente)', async () => {
        const custo = await generateCustomer(generateUser());

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.save(custo);

        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: custo.login?.toUpperCase() });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', "L'email existe déjà.");
      });

      it('409 si le pseudonyme est déjà utilisé', async () => {
        const custo = await generateCustomer(generateUser());

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.save(custo);

        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), username: custo.username });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
          'message',
          'Ce pseudonyme existe déjà.'
        );
      });
    });

    describe('422 Unprocessable Entity', () => {
      it('422 si le mail est mal formaté', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), email: 'notanemail' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          'Adresse email invalide.'
        );
      });

      it('422 si le pseudonyme est invalide', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({
            ...generateUser(),
            username: "j'ai des caractères invalides",
          });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'Pseudonyme invalide.');
      });

      it('422 si le mot de passe fait moins de 8 caractères', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Sh0rt!!' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
        );
      });

      it("422 si le mot de passe n'a pas de chiffre", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Password!!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
        );
      });

      it("422 si le mot de passe n'a pas de majuscule", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'password0!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
        );
      });

      it("422 si le mot de passe n'a pas de minuscule", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'PASSWORD0!?' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
        );
      });

      it("422 si le mot de passe n'a pas de caractère spécial", async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({ ...generateUser(), password: 'Password12' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
        );
      });
    });
  });

  describe('POST /users/auth', () => {
    let u: { username: string; password: string; email: string },
      username: string,
      email: string,
      password: string,
      userU: { login: string; password: string },
      userE: { login: string; password: string };

    beforeAll(async () => {
      u = generateUser();
      const customer = await generateCustomer(u);
      username = u.username;
      email = u.email;
      password = u.password;
      userU = { login: username, password };
      userE = { login: email, password };

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);

      await customerRepository.clear();
      await seedDatabase(AppDataSource);
      await customerRepository.save(customer);
    });

    describe('200 OK', () => {
      it("200 si l'entrée est valide, devrait renvoyer un token (utilisateur, pseudonyme)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(userU);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });

      it("200 si l'entrée est valide, devrait renvoyer un token (utilisateur, email)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(userE);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });

      it("200 si l'entrée est valide, devrait renvoyer un token (mainadmin, pseudonyme)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(mainadminCredsU);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });

      it("200 si l'entrée est valide, devrait renvoyer un token (mainadmin, email)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send(mainadminCredsE);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });
    });

    describe('400 Bad Request', () => {
      it("400 s'il manque le login", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ password });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiant et mot de passe requis.'
        );
      });

      it("400 s'il manque le mot de passe (pseudonyme)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ login: username });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiant et mot de passe requis.'
        );
      });

      it("400 s'il manque le mot de passe (email)", async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ login: email });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiant et mot de passe requis.'
        );
      });
    });

    describe('401 Unauthorized', () => {
      it("401 si le pseudonyme n'existe pas", async () => {
        const { username: username2 } = generateUser();
        const response = await request(app).post('/api/v1/users/auth').send({
          login: username2,
          password,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiants incorrect.'
        );
      });

      it("401 si l'email n'existe pas", async () => {
        const { email: email2 } = generateUser();
        const response = await request(app).post('/api/v1/users/auth').send({
          login: email2,
          password,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiants incorrect.'
        );
      });

      it('401 si le couple pseudonyme-mdp est faux', async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ login: username, password: 'wrongPassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiants incorrect.'
        );
      });

      it('401 si le couple email-mdp est faux', async () => {
        const response = await request(app)
          .post('/api/v1/users/auth')
          .send({ login: email, password: 'wrongPassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Identifiants incorrect.'
        );
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
        const customer = await generateCustomer(user);
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.clear();

        await seedDatabase(AppDataSource);
        await customerRepository.save(customer);

        const userData = await customerRepository.findOneBy({
          login: user.email,
        });
        if (!userData) return;
        userId = userData.id;

        token = generateJWT(userId, userData.admin);
        mainadminToken = generateJWT(0, true);
      });

      describe('200 OK', () => {
        it("200 si l'entrée est valide, renvoie les informations utilisateur (utilisateur)", async () => {
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('id', userId);
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
          expect(response.body).toHaveProperty(
            'username',
            mainadminCredsU.login
          );
          expect(response.body).toHaveProperty('login', mainadminCredsE.login);
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
          expect(response.body).toHaveProperty(
            'message',
            'Authentification requise.'
          );
        });

        it('401 si le token est invalide', async () => {
          const invalidToken = 'invalid.token';
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${invalidToken}`);

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message', 'Token invalide.');
        });

        it('401 si le token est valide mais expiré', async () => {
          const expiredToken = generateExpiredJWT(userId, false);
          const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${expiredToken}`);

          expect(response.status).toBe(401);
          expect(response.body).toHaveProperty('message', 'Le token a expiré.');
        });
      });
    });

    describe('PATCH /users/me', () => {
      let user: { username: string; password: string; email: string },
        user2: { username: string; password: string; email: string },
        token: string,
        id: number,
        /**
         * Vérifie si le Customer et user ont le même id, pseudonyme, mail et mot de passe
         */
        checkUser: (c: Customer) => Promise<boolean>;

      beforeAll(async () => {
        user = generateUser();
        const custo1 = await generateCustomer(user);

        user2 = generateUser();
        const custo2 = await generateCustomer(user2);

        checkUser = async (c: Customer) =>
          c.username === user.username &&
          c.login === user.password &&
          (await compare(user.password, c.pwd_hash)) &&
          c.id === id;

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const customerRepository = AppDataSource.getRepository(Customer);
        await customerRepository.clear();

        await seedDatabase(AppDataSource);
        await customerRepository.save(custo1);
        await customerRepository.save(custo2);

        const userData = await customerRepository.findBy({
          username: user.username,
          login: user.email,
        });
        id = userData[0].id;
        token = generateJWT(id, userData[0].admin);
      });

      describe('200 OK', () => {
        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username)", async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: newUsername });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username: user.username,
          });
          expect(oldUserData).toHaveLength(0);

          user.username = newUsername;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (email)", async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: newEmail });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(oldUserData).toHaveLength(0);

          user.email = newEmail;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (mot de passe)", async () => {
          const { password: newPassword } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: newPassword });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);

          user.password = newPassword;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username, mail & mot de passe)", async () => {
          const u = generateUser();
          const {
            username: newUsername,
            email: newEmail,
            password: newPassword,
          } = u;
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send(u);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(oldUserData).toHaveLength(0);
          user.username = newUsername;
          user.email = newEmail;
          user.password = newPassword;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (username & ancien mail & ancien mot de passe)", async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
              username: newUsername,
              email: user.email,
              password: user.password,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(oldUserData).toHaveLength(0);

          user.username = newUsername;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (ancien username & mail & ancien mot de passe)", async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
              username: user.username,
              email: newEmail,
              password: user.password,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);
          const oldUserData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(oldUserData).toHaveLength(0);

          user.email = newEmail;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });

        it("200 si l'entrée est valide, et que les données ont bien été mise à jour (ancien username & ancien mail & mot de passe)", async () => {
          const { password: newPassword } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
              username: user.username,
              email: user.email,
              password: newPassword,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty(
            'message',
            "Les informations de l'utilisateur ont été mises à jour avec succès."
          );

          const customerRepository = AppDataSource.getRepository(Customer);

          user.password = newPassword;
          const userData = await customerRepository.findBy({
            username: user.username,
            login: user.email,
          });
          expect(userData).toHaveLength(1);
          expect(checkUser(userData[0])).toBeTruthy();
        });
      });

      it("400 aucun paramètre n'est fourni", async () => {
        const response = await request(app)
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${token}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
          'message',
          'Aucune modification indiquée.'
        );
      });

      describe('401 Unauthorized', () => {
        it("401 s'il manque le token", async () => {
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
          const invalidToken = 'invalid.token';
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

        it('401 si le token est valide mais expiré', async () => {
          const { username: newUsername, email: newEmail } = generateUser();
          const expiredToken = generateExpiredJWT(id, false);
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
        it('409 si le mail est déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: user2.email });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty(
            'message',
            'Cette adresse mail est déjà liée à un compte.'
          );
        });

        it('409 si le pseudonyme est déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: user2.username });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty(
            'message',
            'Ce pseudonyme est déjà pris.'
          );
        });

        it('409 si le mail et le pseudonyme sont déjà pris', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: user2.email, username: user2.username });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty('message');
        });

        it('409 si le mail est déjà pris, malgré un pseudonyme valide', async () => {
          const { username: newUsername } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: user2.email, username: newUsername });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty(
            'message',
            'Cette adresse mail est déjà liée à un compte.'
          );
        });

        it('409 si le pseudonyme est déjà pris, malgré un mail valide', async () => {
          const { email: newEmail } = generateUser();
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: user2.username, email: newEmail });

          expect(response.status).toBe(409);
          expect(response.body).toHaveProperty(
            'message',
            'Ce pseudonyme est déjà pris.'
          );
        });
      });

      describe('422 Unprocessable Entity', () => {
        it('422 si le mail est invalide', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'cecinestpasunemail' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            'Adresse email invalide.'
          );
        });

        it('422 si le pseudonyme est invalide', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
              username: "ceci n'est pas un nom d'utilisateur valide &&",
            });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            'Pseudonyme invalide.'
          );
        });

        it('422 si le mot de passe fait moins de 8 caractères', async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'Sh0rt!!' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
          );
        });

        it("422 si le mot de passe n'a pas de chiffre", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'Password!!?' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
          );
        });

        it("422 si le mot de passe n'a pas de majuscule", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'password0!?' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
          );
        });

        it("422 si le mot de passe n'a pas de minuscule", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'PASSWORD0!?' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
          );
        });

        it("422 si le mot de passe n'a pas de caractère spécial", async () => {
          const response = await request(app)
            .patch('/api/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'Password12' });

          expect(response.status).toBe(422);
          expect(response.body).toHaveProperty(
            'message',
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre, un caractère spécial et être d'au moins 8 caractères."
          );
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
      user = generateUser();
      const custo = await generateCustomer(user);

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();

      await seedDatabase(AppDataSource);
      await customerRepository.save(custo);

      const userData = await customerRepository.findOneBy({
        login: user.email,
      });
      if (!userData) return;

      id = userData.id;
      userToken = generateJWT(id, userData.admin);
      adminToken = generateJWT(0, true);
    });

    it("200 si le token admin est valide et l'ID existe, devrait retourner les informations de l'utilisateur", async () => {
      const response = await request(app)
        .get(`/api/v1/users/info/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.username).toBe(user.username);
      expect(response.body.login).toBe(user.email);
      expect(response.body.points).toBe(0);
      expect(response.body.restricted).toBeFalsy();
      expect(response.body.admin).toBeFalsy();
    });

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).get(`/api/v1/users/info/${id}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .get(`/api/v1/users/info/${id}`)
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(0, true);
        const response = await request(app)
          .get(`/api/v1/users/info/${id}`)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });

    it("403 si un utilisateur sans droits admin tente d'accéder aux informations", async () => {
      const response = await request(app)
        .get(`/api/v1/users/info/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
    });

    it("404 si l'ID ne correspond à aucun utilisateur", async () => {
      const response = await request(app)
        .get('/api/v1/users/info/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'Utilisateur introuvable.'
      );
    });

    it("422 si l'ID n'est pas numérique", async () => {
      const response = await request(app)
        .get('/api/v1/users/info/notanumber')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty(
        'message',
        "L'ID n'est pas numérique."
      );
    });
  });

  describe('POST /users/find', () => {
    let userToken: string,
      adminToken: string,
      mainadminToken: string,
      userId: number,
      user: { username: string; password: string; email: string },
      admin: { username: string; password: string; email: string };

    beforeAll(async () => {
      user = generateUser();
      const custo = { ...(await generateCustomer(user)), points: 80 };
      admin = generateUser();
      const custoA = { ...(await generateCustomer(admin)), admin: true };

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      const customerRepository = AppDataSource.getRepository(Customer);
      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      await customerRepository.save(custo);
      await customerRepository.save(custoA);

      const userData = await customerRepository.findOneBy({
        username: user.username,
      });
      const adminData = await customerRepository.findOneBy({
        username: admin.username,
      });

      if (!userData || !adminData) return;
      userId = userData.id;

      userToken = generateJWT(userId, false);
      adminToken = generateJWT(adminData.id, true);
      mainadminToken = generateJWT(0, true);
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
          .send({ restricted: true });

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
      it("401 s'il manque le token", async () => {
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

      it('401 si le token est valide mais expiré', async () => {
        const token = generateExpiredJWT(userId, false);
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

    it('403 si un utilisateur sans droits admin tente de chercher des utilisateurs', async () => {
      const response = await request(app)
        .post('/api/v1/users/find/')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pointsMin: 50,
          pointsMax: 200,
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants.');
    });

    describe('422 Unprocessable Entity', () => {
      it('422 si les filtres sont invalides (id non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ id: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'id invalide.');
      });

      it('422 si les filtres sont invalides (pointsMin non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'pointsMin invalide.');
      });

      it('422 si les filtres sont invalides (pointsMax non numérique)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMax: '0' });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'pointsMax invalide.');
      });

      it('422 si les filtres sont invalides (pointsMin < 0)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: -10 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'pointsMin négatif.');
      });

      it('422 si les filtres sont invalides (pointsMin > pointsMax)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ pointsMin: 100, pointsMax: 10 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty(
          'message',
          'Le minimum est plus grand que le maximum.'
        );
      });

      it('422 si les filtres sont invalides (restricted non booléen)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ restricted: 100 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'restricted invalide.');
      });

      it('422 si les filtres sont invalides (admin non booléen)', async () => {
        const response = await request(app)
          .post('/api/v1/users/find/')
          .set('Authorization', `Bearer ${mainadminToken}`)
          .send({ admin: 100 });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('message', 'admin invalide.');
      });
    });
  });
});
