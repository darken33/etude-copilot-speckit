# Backend Mock - API Connaissance Client

Ce backend mock simule l'API Connaissance Client décrite dans le fichier OpenAPI `spec/connaissance-client-api.yaml`.

## 🚀 Démarrage Rapide

### Option 1: Lancer frontend + backend ensemble
```bash
npm run dev
```

### Option 2: Lancer seulement le backend mock
```bash
npm run dev:server
```

### Option 3: Lancer séparément
```bash
# Terminal 1 - Backend Mock
npm run server

# Terminal 2 - Frontend React
npm start
```

## 📡 API Endpoints

Le serveur mock démarre sur `http://localhost:8080` et expose les endpoints suivants :

### Authentification
**Note :** L'API ne requiert pas d'authentification JWT selon la spécification OpenAPI actuelle (`security: []`).
Le header `Authorization: Bearer <token>` n'est plus nécessaire pour les requêtes.

### Routes disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/v1/connaissance-clients` | Liste tous les clients |
| POST | `/v1/connaissance-clients` | Crée un nouveau client |
| GET | `/v1/connaissance-clients/:id` | Récupère un client par ID |
| DELETE | `/v1/connaissance-clients/:id` | Supprime un client |
| PUT | `/v1/connaissance-clients/:id` | Modification globale d'un client existant (tous les champs, y compris nom et prénom, sont modifiables) |
| PUT | `/v1/connaissance-clients/:id/adresse` | Met à jour l'adresse d'un client |
| PUT | `/v1/connaissance-clients/:id/situation` | Met à jour la situation familiale |
| GET | `/health` | Health check |

## 📊 Données de Test

Le serveur mock contient 8 clients de test avec des données variées :

- **Philippe Bousquet** (Bordeaux) - Marié, 2 enfants
- **Marie Dupont** (Paris) - Célibataire, 0 enfant
- **Jean Martin** (Marseille) - Marié, 3 enfants
- **Sophie Bernard** (Lyon) - Célibataire, 1 enfant
- **Pierre Moreau** (Toulouse) - Marié, 4 enfants
- **Catherine Leroy** (Lille) - Célibataire, 0 enfant
- **Thomas Roux** (Nantes) - Marié, 1 enfant
- **Isabelle Fournier** (Strasbourg) - Mariée, 2 enfants

## 🔧 Configuration

### Base de données
Les données sont stockées dans `db.json` et persistées automatiquement.

### CORS
Le serveur mock gère automatiquement les headers CORS pour permettre les requêtes depuis `http://localhost:3000`.

### Validation
Validation basique des champs obligatoires selon les spécifications OpenAPI.

## 🧪 Tests avec Curl

```bash
# Lister tous les clients
curl http://localhost:8080/v1/connaissance-clients

# Récupérer un client spécifique
curl http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee

# Créer un nouveau client (création uniquement, pas de modification)
# Note: ligne2 est optionnel et peut être omis si vide
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nouveau",
    "prenom": "Client",
    "ligne1": "123 Rue Test",
    "codePostal": "75001",
    "ville": "Paris",
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }' \
  http://localhost:8080/v1/connaissance-clients

# Mettre à jour l'adresse d'un client existant (modification partielle)
# Note: ligne2 est optionnel et peut être omis
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "ligne1": "456 Avenue Nouvelle",
    "ligne2": "Apt 5",
    "codePostal": "75002",
    "ville": "Paris"
  }' \
  http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/adresse

# Mettre à jour la situation familiale d'un client existant (modification partielle)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }' \
  http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/situation

# Exemple: Changement de situation vers DIVORCE
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "situationFamiliale": "DIVORCE",
    "nombreEnfants": 2
  }' \
  http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/situation

# Exemple: Changement de situation vers VEUF
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "situationFamiliale": "VEUF",
    "nombreEnfants": 1
  }' \
  http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/situation

# Exemple: Changement de situation vers PACSE
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "situationFamiliale": "PACSE",
    "nombreEnfants": 0
  }' \
  http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/situation
```

## 🐛 Dépannage

### Port déjà utilisé
Si le port 8080 est occupé, modifiez le port dans `server.js` :
```javascript
server.listen(3001, () => { // Changez 8080 vers 3001
```

Et mettez à jour la variable d'environnement dans `.env.development` :
```bash
REACT_APP_API_BASE_URL=http://localhost:3001
```

### Données corrompues
Pour réinitialiser les données, supprimez le fichier `db.json` et relancez le serveur.

## 📝 Logs

Le serveur affiche tous les appels API dans la console :
```
[2025-11-15T10:30:00.000Z] GET /v1/connaissance-clients
[2025-11-15T10:30:05.000Z] POST /v1/connaissance-clients
```

## 🔄 Rechargement Auto

Le serveur mock ne redémarre pas automatiquement. Pour les modifications du serveur, relancez manuellement :
```bash
npm run server
```