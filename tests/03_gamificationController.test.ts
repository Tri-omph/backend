import request from 'supertest';
import { hash } from 'bcrypt';

import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { generateExpiredJWT, resetDataSource } from './utils';
import { seedDatabase } from '../src/database/seed/mainSeeder';
import { AppDataSource } from '../src/database/data-source';
import { generateJWT } from '../src/utils';

let i = 0;
const addCustomer = async (
  username: string,
  points: number
): Promise<Customer> => {
  const custo: Partial<Customer> = {
    username,
    pwd_hash: await hash('Pwd!5678', 10),
    login: `testuser${i++}@example.com`,
    points,
  };
  const customerRepository = AppDataSource.getRepository(Customer);

  return customerRepository.save(custo);
};

beforeAll(async () => {
  await resetDataSource();
});

describe('/game', () => {
  let users: { username: string; points: number }[],
    usersSorted: { username: string; points: number }[];

  describe('POST /game/leaderboard', () => {
    beforeEach(async () => {
      const customerRepository = AppDataSource.getRepository(Customer);

      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      users = [
        { username: 'third', points: 8000 },
        { username: 'second', points: 9000 },
        { username: 'sixth', points: 5000 },
        { username: 'tenth', points: 1000 },
        { username: 'ninth', points: 2000 },
        { username: 'fifth', points: 6000 },
        { username: 'fourth', points: 7000 },
        { username: 'seventh', points: 4000 },
        { username: 'first', points: 10000 },
        { username: 'eighth', points: 3000 },
      ];

      usersSorted = Array.from(users);
      usersSorted.sort((a, b) => b.points - a.points);

      await Promise.all(
        users.map(async (el) => addCustomer(el.username, el.points))
      );
    });

    describe('200 OK', () => {
      it('200 devrait renvoyer le classement complet', async () => {
        const response = await request(app)
          .get('/api/v1/game/leaderboard')
          .expect(200);

        const leaderboard = response.body;
        expect(leaderboard).toHaveLength(11);
        for (let i = 0; i < 10; i++) {
          expect(leaderboard[i].username).toBe(usersSorted[i].username);
          expect(leaderboard[i].points).toBe(usersSorted[i].points);
        }
      });

      it('200 devrait renvoyer les 5 premiers', async () => {
        const response = await request(app)
          .get('/api/v1/game/leaderboard?limit=5')
          .expect(200);

        const leaderboard = response.body;
        expect(leaderboard).toHaveLength(5);
        for (let i = 0; i < 5; i++) {
          expect(leaderboard[i].username).toBe(usersSorted[i].username);
          expect(leaderboard[i].points).toBe(usersSorted[i].points);
        }
      });
    });

    describe('422 Unprocessable Entity', () => {
      it("422 si la limite indiquée n'est pas numérique", async () => {
        const response = await request(app)
          .get('/api/v1/game/leaderboard?limit=abc')
          .expect(422);

        expect(response.body.message).toBe('Limite invalide.');
      });
    });
  });

  describe('GET /game/leaderboard/me', () => {
    let users: { username: string; points: number; id: number }[],
      usersSorted: { username: string; points: number; id: number }[];
    beforeEach(async () => {
      const customerRepository = AppDataSource.getRepository(Customer);

      await customerRepository.clear();
      await seedDatabase(AppDataSource);

      if (!AppDataSource.isInitialized) await AppDataSource.initialize();

      users = [
        { username: 'third', points: 8000, id: 0 },
        { username: 'second', points: 9000, id: 0 },
        { username: 'sixth', points: 5000, id: 0 },
        { username: 'tenth', points: 1000, id: 0 },
        { username: 'ninth', points: 2000, id: 0 },
        { username: 'fifth', points: 6000, id: 0 },
        { username: 'fourth', points: 7000, id: 0 },
        { username: 'seventh', points: 4000, id: 0 },
        { username: 'first', points: 10000, id: 0 },
        { username: 'eighth', points: 3000, id: 0 },
      ];

      await Promise.all(
        users.map(async (el, i) => {
          const custo = await addCustomer(el.username, el.points);
          users[i].id = custo.id;
        })
      );

      usersSorted = Array.from(users);
      usersSorted.sort((a, b) => b.points - a.points);
    });

    describe('200 OK', () => {
      it("200 devrait renvoyer le rang de l'utilisateur actuel", async () => {
        await Promise.all(
          usersSorted.map(async (el, i) => {
            const response = await request(app)
              .get('/api/v1/game/leaderboard/me')
              .set('Authorization', `Bearer ${generateJWT(el.id, false)}`)
              .expect(200);

            expect(response.body.rank).toBe(i + 1);
          })
        );
      });
    });

    describe('401 Unauthorized', () => {
      it("401 s'il manque le token", async () => {
        const response = await request(app).get('/api/v1/game/leaderboard/me');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
          'message',
          'Authentification requise.'
        );
      });

      it('401 si le token est invalide', async () => {
        const invalidToken = 'invalid.token';
        const response = await request(app)
          .get('/api/v1/game/leaderboard/me')
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token invalide.');
      });

      it('401 si le token est valide mais expiré', async () => {
        const expiredToken = generateExpiredJWT(1, false);
        const response = await request(app)
          .get('/api/v1/game/leaderboard/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Le token a expiré.');
      });
    });
  });
});
