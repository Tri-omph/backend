# Documentation des Endpoints API

Ce document décrit les différents endpoints API de **Tri'omph**, avec des informations sur leur fonctionnalité, le format des requêtes et des réponses, ainsi que les codes de réponse HTTP possibles.

## URL de base

L'URL de base pour tous les endpoints est :

```
https://votre-domaine.com/api/v1
```

Pendant le développement, l'URL sera :

```
http://localhost:3000/api/v1
```

## Utilisation des Endpoints API

Il est possible d'utiliser des outils tels que [Postman](https://www.postman.com) ou [Insomnia](https://insomnia.rest) pour effectuer des appels aux différents endpoints API et observer les réponses du serveur.
Ils peuvent directement importer le fichier `openapi.yaml` pour faciliter l'utilisation.

## Endpoints

### POST /auth

#### Description :

Authentifie un utilisateur en vérifiant son nom d'utilisateur et son mot de passe, et renvoie un token JWT.

#### Corps de la requête :

```json
{
  "username": "exampleUser",
  "password": "examplePassword"
}
```

#### Réponses :

- **200 OK** : Authentification réussie, renvoie un token JWT.
  ```json
  {
    "token": "your-jwt-token"
  }
  ```
- **401 Unauthorized** : Nom d'utilisateur ou mot de passe incorrect.
  ```json
  {
    "error": true,
    "message": "Nom d'utilisateur ou mot de passe incorrect."
  }
  ```
- **429 Too Many Requests** : Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.

---

### POST /users

#### Description :

Crée un nouveau compte utilisateur, vérifie l'unicité du nom d'utilisateur et de l'email, et renvoie un token JWT.

#### Corps de la requête :

```json
{
  "username": "newUser",
  "password": "newPassword",
  "email": "newuser@example.com"
}
```

#### Réponses :

- **201 Created** : Utilisateur créé avec succès, renvoie un token JWT.
  ```json
  {
    "token": "your-jwt-token"
  }
  ```
- **400 Bad Request** : Entrée invalide ou l'email/nom d'utilisateur est déjà pris.
  ```json
  {
    "error": true,
    "message": "L'email ou le nom d'utilisateur existe déjà."
  }
  ```
- **429 Too Many Requests** : Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.

---

### GET /users/me

#### Description :

Récupère les informations de l'utilisateur actuellement authentifié à l'aide de son token JWT.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : Informations de l'utilisateur récupérées avec succès.
  ```json
  {
    "username": "existingUser",
    "email": "existinguser@example.com"
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou manquant.
  ```json
  {
    "error": true,
    "message": "Non autorisé."
  }
  ```

---

### PATCH /users/me

#### Description :

Met à jour le profil de l'utilisateur actuel, par exemple son email ou son nom d'utilisateur.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Corps de la requête :

```json
{
  "email": "updatedemail@example.com",
  "username": "updatedUsername"
}
```

#### Réponses :

- **200 OK** : Informations de l'utilisateur mises à jour avec succès.
  ```json
  {
    "message": "Les informations de l'utilisateur ont été mises à jour avec succès."
  }
  ```
- **400 Bad Request** : Entrée invalide.
  ```json
  {
    "error": true,
    "message": "Données d'entrée invalides."
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou manquant.

---

### POST /scan/barcode

#### Description :

Accepte un code-barres et renvoie le résultat de la reconnaissance. **TODO: Voir avec le frontend**

#### Corps de la requête :

```json
{}
```

#### Réponses :

- **200 OK** : Scan traité avec succès, renvoie les résultats de la reconnaissance.
  ```json
  {}
  ```
- **400 Bad Request** : Données de scan invalides.
  ```json
  {
    "error": true,
    "message": "Données de scan invalides."
  }
  ```
- **429 Too Many Requests** : Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.

---

### POST /scan/image

#### Description :

Accepte une image pour le scan des déchets et renvoie le résultat de la reconnaissance. **TODO: Voir avec le frontend**

#### Corps de la requête :

```json
{}
```

#### Réponses :

- **200 OK** : Scan traité avec succès, renvoie les résultats de la reconnaissance.
  ```json
  {}
  ```
- **400 Bad Request** : Données de scan invalides.
  ```json
  {
    "error": true,
    "message": "Données de scan invalides."
  }
  ```
- **429 Too Many Requests** : Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.

---

### GET /ai-data

#### Description :

Récupère les données mises à jour de l'IA pour améliorer la reconnaissance d'objets locale pour une utilisation hors ligne.

#### Réponses :

- **200 OK** : Données du modèle IA récupérées avec succès.
  ```json
  {
    "version": "1.2.3",
    "lastUpdated": "2024-11-26T12:00:00Z"
  }
  ```
- **404 Not Found** : Données du modèle IA introuvables.

---

### POST /waste-info

#### Description :

Permet aux utilisateurs de soumettre des informations manuelles sur un déchet. **TODO: Voir avec le frontend**

#### Corps de la requête :

```json
{}
```

#### Réponses :

- **200 OK** : Informations soumises avec succès.
  ```json
  {
    "message": "Informations sur les déchets soumises avec succès."
  }
  ```
- **400 Bad Request** : Informations sur les déchets invalides.
  ```json
  {
    "error": true,
    "message": "Informations sur les déchets invalides."
  }
  ```

---

### GET /location/recycling-info

#### Description :

Récupère les règles locales de recyclage et les informations basées sur la géolocalisation. **TODO: Voir avec le frontend**

#### Paramètres de la requête :

- **lat** : Latitude (obligatoire)
- **long** : Longitude (obligatoire)

#### Exemple de requête :

```
GET /location/recycling-info?lat=48.8566&long=2.3522
```

#### Réponses :

- **200 OK** : Informations locales de recyclage récupérées avec succès.
  ```json
  {}
  ```
- **400 Bad Request** : Données de géolocalisation invalides.
  ```json
  {
    "error": true,
    "message": "Données de géolocalisation invalides."
  }
  ```
- **404 Not Found** : Aucune information de recyclage trouvée pour la localisation donnée.
  ```json
  {
    "error": true,
    "message": "Aucune information de recyclage trouvée pour cette localisation."
  }
  ```

---

## Codes de Réponse

- **200 OK** : La requête a été réussie et la réponse contient les données demandées.
- **201 Created** : La ressource a été créée avec succès.
- **400 Bad Request** : La requête est invalide ou malformée.
- **401 Unauthorized** : L'authentification a échoué ou l'utilisateur n'est pas autorisé à effectuer l'opération demandée.
- **404 Not Found** : La ressource demandée n'a pas été trouvée.
- **429 Too Many Requests** : L'utilisateur a dépassé la limite de requêtes.
- **500 Internal Server Error** : Un message d'erreur générique indiquant un problème avec le serveur.
