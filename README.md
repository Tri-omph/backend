# Tri'omph - Backend

### Comment utiliser le projet

Pour utiliser ce projet, suivez les étapes ci-dessous :

1. **Installer les dépendances**  
   Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé (version recommandée : LTS). Clonez le dépôt, puis installez les dépendances avec :

   ```bash
   npm install
   ```

2. **Créer le fichier `.env`**  
   Copiez le fichier `.env.example` en `.env` et configurez les variables nécessaires, par exemple :

   ```plaintext
   PORT=3000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret_key
   ```

   Ces variables sont nécessaires pour le fonctionnement de l'application.

3. **Compiler le code TypeScript**  
   Compilez le code TypeScript en JavaScript avec la commande :

   ```bash
   npm run build
   ```

4. **Lancer l'application**  
   Démarrez le serveur en exécutant :

   ```bash
   npm start
   ```

   Par défaut, le serveur sera accessible sur [http://localhost:3000](http://localhost:3000).

5. **Exécuter les tests**  
   Si vous souhaitez vérifier que tout fonctionne correctement, lancez les tests :

   ```bash
   npm test
   ```

6. **Lint et formatage**  
   Pour vérifier et corriger le formatage ou les erreurs de linting, utilisez :
   ```bash
   npm run lint:fix
   npm run format
   ```

### Notes supplémentaires

- Si vous utilisez une base de données locale, vérifiez que votre instance est en cours d'exécution avant de lancer le projet.
- Utilisez le fichier `ENDPOINTS.md` et les commentaires dans le code pour en apprendre plus sur chaque fichier, chanque endpoint et leur fonction.

### Structure du Projet

Le projet suit une architecture modulaire et claire pour faciliter la maintenance et l'extensibilité.

- **`src/`** : Contient tout le code source du projet.

  - **`app.ts`** : Point d'entrée principal de l'application Express où les middlewares et routes sont configurés.
  - **`controllers/`** : Contient la logique métier pour chaque ressource, comme `userController.ts` qui gère la création, la récupération et la mise à jour des utilisateurs.
  - **`routes/`** : Contient toutes les définitions de routes pour l'API, comme `UserRoutes.ts` qui gère les routes `/api/v1/users`.
  - **`middlewares/`** : Contient les middlewares, comme `ErrorHandler.ts` qui gère les erreurs globales de l'application.
  - **`models/`** : Les modèles définissent la structure des données et les interactions avec la base de données. Chaque modèle correspond à une entité spécifique de l'application (par exemple, `User.ts` représente un utilisateur). Ces modèles sont utilisés dans les contrôleurs pour récupérer, créer, mettre à jour ou supprimer des données dans la base de données.

- **`tests/`** : Contient les tests unitaires et d'intégration pour garantir que l'application fonctionne correctement.
  - Les tests sont organisés en fonction des fonctionnalités, comme `userController.test.ts` pour tester les actions des utilisateurs.
- **`package.json`** : Dépendances du projet et scripts pour la gestion de l'application, comme les commandes `npm start`, `npm run build`, et `npm test`.
- **`tsconfig.json`** : Configuration de TypeScript pour définir le comportement de la compilation et la résolution des modules.
- **`dist/`** : Dossier contenant le code compilé en JavaScript après la compilation TypeScript.
- **`node_modules/`** : Contient toutes les dépendances installées par `npm`.
- **`.prettierrc`** : Fichier de configuration pour Prettier afin d'assurer un formatage de code cohérent.
- **`.eslintrc.json`** : Configuration d'ESLint pour maintenir une qualité de code optimale.
- **`.gitignore`** : Spécifie les fichiers et répertoires à ignorer par Git, comme les fichiers de build ou les dépendances.
- **`.husky/`** : Dossier contenant la configuration pour les hooks Git (comme les pré-commits) pour automatiser certaines vérifications avant les commits.
- **`.github/`** : Dossier contenant les workflows GitHub Actions, comme `ci.yaml`, pour automatiser les processus de test et de déploiement.

Cette structure permet de séparer les responsabilités de manière claire et d'assurer une organisation maintenable à long terme. Les fichiers de configuration garantissent également la cohérence dans le développement et le déploiement du projet.

### **Contribuer au Projet**

Ce projet est une collaboration entre les membres de notre groupe dans le cadre scolaire. Les contributions sont limitées aux membres de l’équipe afin de respecter nos objectifs, les délais, et les directives académiques.

#### **Comment Contribuer**

1. **Travailler sur les Tâches Assignées** :  
   Consultez notre outil de gestion des tâches ou les discussions de groupe pour voir les tâches qui vous sont attribuées.

2. **Respecter les Standards de Code** :

   - Suivez les configurations ESLint et Prettier fournies dans le dépôt.
   - Assurez-vous que votre code est typé et cohérent avec la structure existante.
   - Rédigez des messages de commit clairs et précis pour décrire vos modifications.

3. **Utiliser un Workflow par Branches** :

   - Créez une nouvelle branche pour vos travaux. Utilisez des noms descriptifs comme `feature/<nom-tâche>` ou `fix/<nom-bug>`.
   - Évitez de committer directement sur la branche principale (`main`).

4. **Tester votre Code** :

   - Écrivez des tests pour chaque nouvelle fonctionnalité ou correction de bug que vous implémentez.
   - Lancez tous les tests localement avant de soumettre vos modifications :
     ```bash
     npm test
     ```

5. **Processus de Revue de Code** :

   - Poussez votre branche et créez une _pull request_ (PR) vers la branche `main`.
   - Attendez l’approbation d’au moins un autre membre de l’équipe avant de fusionner votre PR.

6. **Mettre à Jour la Documentation** :
   - Modifiez le fichier de spécification OpenAPI (`openapi.yaml`) et toute autre documentation pertinente si vos modifications ajoutent de nouveaux endpoints ou modifient ceux existants.
   - Si nécessaire, mettez à jour les instructions d’installation ou d’utilisation dans le fichier principal `README.md`.

#### **Engagement pour la Qualité**

- Relisez votre code pour corriger toute erreur ou fonctionnalité incomplète avant de le soumettre.
- Utilisez les Actions GitHub pour valider automatiquement vos modifications (linting, tests, etc.).
- Si vous avez des questions ou des doutes sur une tâche, demandez l’avis du reste de l’équipe.

#### **Ce qu’il ne faut PAS Faire**

- Ne faites pas de modifications non approuvées directement sur la branche `main`.
- N’introduisez pas de bibliothèques externes sans consulter l’équipe.
- N’acceptez pas d’aide extérieure, car ce projet doit refléter le travail collectif du groupe.

---

Pour toute question sur le workflow, veuillez consulter le responsable du groupe ou le superviseur du projet.
