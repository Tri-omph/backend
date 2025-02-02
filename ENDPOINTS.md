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
- **400 Bad Request** : Paramètres manquants.
- **409 Conflict** : Le mail ou le pseudonyme sont déjà pris (sensible à la casse).
- **422 Unprocessable Entity** : Erreur de formatage des entrées.
- **429 Too Many Requests** : Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.

---

### POST /users/auth

#### Description :

Authentifie un utilisateur en vérifiant son nom d'utilisateur ou adresse mail et son mot de passe, et renvoie un token JWT.

#### Corps de la requête :

```json
{
  "login": "exampleUser",
  "password": "examplePassword"
}
```

```json
{
  "login": "user@example.com",
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
- **400 Bad Request** : Entrée invalide.
- **401 Unauthorized** : Nom d'utilisateur ou mot de passe incorrect.
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
- **401 Unauthorized** : Token JWT invalide ou manquant.
- **409 Conflict** : Email et/ou pseudonyme déjà pris.
- **422 Unprocessable Entity** : Email, pseudonyme et/ou mot de passe invalide.

---

### GET /users/info/:id

#### Description :

Obtenir les informations détaillées d'un utilisateur spécifique à partir de son ID.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : Informations de l'utilisateur récupérées avec succès.
  ```json
  {
    "id": 123,
    "username": "exampleUser",
    "email": "user@example.com",
    "points": 100,
    "restricted": false,
    "admin": false
  }
  ```
- **400 Bad Request** : Id non fourni.
- **401 Unauthorized** : Token JWT invalide ou expiré.
- **403 Forbidden** : Token JWT avec droits insuffisants.
- **404 Not Found** : Utilisateur introuvable.
- **422 Unprocessable Entity** : Id non numérique.

---

### POST /users/find/

#### Description :

Permet de chercher des utilisateurs en fonction de différents filtres.

#### Corps de la requête :

```json
{
  "id": 123,
  "username": "exampleUser",
  "pointsMin": 50,
  "pointsMax": 200,
  "login": "example@example.com",
  "restricted": false,
  "admin": true
}
```

#### Réponses :

- **200 OK** : Résultats de la recherche renvoyés avec succès.
  ```json
  [
    {
      "id": 123,
      "username": "exampleUser",
      "points": 150,
      "restricted": false,
      "admin": true
    },
    {
      ...
    }
  ]
  ```
- **401 Unauthorized** : Token JWT invalide ou expiré.
- **403 Forbidden** : Token JWT avec droits insuffisants.
- **422 Unprocessable Entity** : Erreur de formatage des entrées.

---

### **GET /users/history/me**

#### **Description:**
Récupère l'historique des scans de l'utilisateur actuellement authentifié en utilisant son token JWT.

#### **En-têtes :**
- **Authorization** : Bearer `your-jwt-token`

#### **Réponses :**
- **200 OK** : Historique récupéré avec succès.
  ```json
  [
    {
      "id": 1,
      "method": "AI",
      "isValid": true,
      "poubelle": "bleu",
      "type": "METAL PACKAGING",
      "date": "2025-02-01T10:00:00Z"
    },
    {
      "id": 2,
      "method": "Barcode",
      "isValid": false,
      "poubelle": "compost",
      "type": "ORGANIC",
      "date": "2025-02-02T14:00:00Z"
    }
  ]
  ```
- **401 Unauthorized** : Token JWT invalide ou manquant.
- **500 Internal Server Error** : Erreur du serveur lors de la récupération de l'historique.

---

### **POST /users/history/me**

#### **Description:**
Ajoute une nouvelle entrée à l'historique des scans de l'utilisateur actuellement authentifié. Utilise le token JWT de l'utilisateur pour vérifier son identité et ajoute un enregistrement dans l'historique.

#### **En-têtes :**
- **Authorization** : Bearer `your-jwt-token`

#### **Corps de la requête :**
```json
{
  "method": "AI",
  "isValid": true,
  "poubelle": "bleu",
  "type": "METAL PACKAGING"
}
```

#### **Réponses :**
- **201 Created** : Historique ajouté avec succès.
- **400 Bad Request** : Données de requête invalides.
- **401 Unauthorized** : Token JWT invalide ou manquant.
- **500 Internal Server Error** : Erreur du serveur lors de l'ajout de l'historique.

---

### **GET /users/history/:id**

#### **Description:**
Récupère l'historique des scans d'un utilisateur spécifique en fonction de son ID. Cette route est protégée et nécessite un token JWT valide pour s'assurer que l'utilisateur a les droits nécessaires.

#### **En-têtes :**
- **Authorization** : Bearer `your-jwt-token`

#### **Réponses :**
- **200 OK** : Historique récupéré avec succès pour l'utilisateur spécifié.
  ```json
  [
    {
      "id": 1,
      "method": "Questions",
      "isValid": true,
      "poubelle": "jaune",
      "type": "METAL PACKAGING",
      "date": "2025-01-15T10:00:00Z"
    }
  ]
  ```
- **401 Unauthorized** : Token JWT invalide ou manquant.
- **403 Forbidden** : L'utilisateur n'a pas les droits nécessaires pour accéder à l'historique de cet utilisateur.
- **404 Not Found** : Utilisateur introuvable ou aucun historique trouvé.
- **500 Internal Server Error** : Erreur du serveur lors de la récupération de l'historique.

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

### PATCH /admin/promote/:id

#### Description :

Promouvoir l'utilisateur avec l'ID indiqué pour lui attribuer les droits d'admin.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : L'utilisateur a été promu avec succès.
  ```json
  {
    "message": "L'utilisateur a été promu avec succès."
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou droits insuffisants.
- **404 Not Found** : Utilisateur introuvable.
- **409 Conflict** : Utilisateur déjà admin.

---

### PATCH /admin/demote/:id

#### Description :

Retirer les droits d'admin de l'admin avec l'ID indiqué. Seul l'admin principal peut effectuer cette opération.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : L'admin a été rétrogradé avec succès.
  ```json
  {
    "message": "Les droits d'admin ont été retirés."
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou droits insuffisants.
- **404 Not Found** : Utilisateur introuvable.
- **409 Conflict** : Utilisateur non admin.

---

### PATCH /admin/restrict/:id

#### Description :

Restreindre un utilisateur avec l'ID indiqué. Si l'utilisateur est un admin, il doit d'abord être rétrogradé avant d'être restreint.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : L'utilisateur a été restreint avec succès.
  ```json
  {
    "message": "L'utilisateur a été restreint avec succès."
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou droits insuffisants.
- **404 Not Found** : Utilisateur introuvable.
- **409 Conflict** : Utilisateur déjà restreint ou administrateur.

---

### PATCH /admin/free/:id

#### Description :

Lever les restrictions imposées à un utilisateur avec l'ID indiqué.

#### En-têtes :

- **Authorization** : Bearer `your-jwt-token`

#### Réponses :

- **200 OK** : Les restrictions sur l'utilisateur ont été levées avec succès.
  ```json
  {
    "message": "L'utilisateur n'est plus restreint."
  }
  ```
- **401 Unauthorized** : Token JWT invalide ou droits insuffisants.
- **404 Not Found** : Utilisateur introuvable.
- **409 Conflict** : Utilisateur non restreint.

---

## Codes de Réponse

- **200 OK** : La requête a été réussie et la réponse contient les données demandées.
- **201 Created** : La ressource a été créée avec succès.
- **400 Bad Request** : La requête est invalide ou malformée.
- **401 Unauthorized** : L'authentification a échoué ou l'utilisateur n'est pas autorisé à effectuer l'opération demandée.
- **404 Not Found** : La ressource demandée n'a pas été trouvée.
- **409 Conflict** : La requête ne peut pas être traitée en raison d'un conflit avec l'état actuel de la ressource.
- **422 Unprocessable Entity** : La requête est bien formée, mais le contenu ne l'est pas.
- **429 Too Many Requests** : L'utilisateur a dépassé la limite de requêtes.
- **500 Internal Server Error** : Un message d'erreur générique indiquant un problème avec le serveur.
