// TODO: faire les tests
/* utiliser request du package supertest pour tester les endpoints
 * pour ce qui pourrait affecter la DB, on peut soit utiliser jest-mock pour "faire semblant" d'ajouter à la DB
 * ou on pourrait utiliser une DB factice temporaire:
beforeAll(async () => {
  await createConnection({
    type: 'sqlite',
    database: ':memory:', // faire la DB dans la mémoire vive
    entities: [<toutes les tables dont on aurait besoin>],
    synchronize: true,
  });
});
 */

// Faux test pour que jest ne crie pas
describe('Basic test', () => {
  it('should always pass', () => {
    expect(1).toBe(1);
  });
});
