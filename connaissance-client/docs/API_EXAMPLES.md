# Exemples d'Utilisation API - Connaissance Client

> Guide complet avec exemples curl et Postman pour tous les endpoints

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green.svg)](https://swagger.io/specification/)
[![Postman](https://img.shields.io/badge/Postman-Collection-orange.svg)](https://www.postman.com/)

---

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Configuration](#-configuration)
- [Scénarios complets](#-scénarios-complets)
- [Endpoints GET](#-endpoints-get)
- [Endpoints POST](#-endpoints-post)
- [Endpoints PUT](#-endpoints-put)
- [Endpoints PATCH](#-endpoints-patch)
- [Endpoints DELETE](#-endpoints-delete)
- [Cas d'erreur](#-cas-derreur)
- [Collection Postman](#-collection-postman)

---

## 🔧 Prérequis

### Services requis

Assurez-vous que les services sont démarrés :

```bash
# MongoDB
docker ps | grep mongo

# Kafka
docker ps | grep kafka

# Application
curl http://localhost:8080/actuator/health
```

### Variables d'environnement

Créer un fichier `.env` :

```bash
# API Base URL
API_BASE_URL=http://localhost:8080

# Authentication (si activée en production)
JWT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# Correlation ID pour traçabilité
CORRELATION_ID=$(uuidgen)
```

### Headers HTTP requis

| Header | Valeur | Obligatoire | Description |
|--------|--------|-------------|-------------|
| `Content-Type` | `application/json` | Oui (POST/PUT/PATCH) | Format du body |
| `X-Correlation-ID` | UUID v4 | Recommandé | Traçabilité end-to-end |
| `Authorization` | `Bearer {token}` | En production | JWT token |

---

## ⚙️ Configuration

### Bash (variables d'environnement)

```bash
export API_BASE_URL="http://localhost:8080"
export CORRELATION_ID=$(uuidgen)

# Fonction helper pour curl
api_call() {
  curl -X "$1" \
    -H "Content-Type: application/json" \
    -H "X-Correlation-ID: $CORRELATION_ID" \
    "$API_BASE_URL$2" \
    ${3:+-d "$3"}
}
```

### HTTPie (alternative à curl)

```bash
# Installation
brew install httpie

# Configuration
export API_BASE_URL="http://localhost:8080"

# Utilisation
http GET $API_BASE_URL/v1/connaissance-clients \
  X-Correlation-ID:$(uuidgen)
```

---

## 🎬 Scénarios complets

### Scénario 1 : Cycle de vie d'un client (CRUD complet)

#### Étape 1 : Créer un nouveau client

```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "33000",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (201 Created) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "12 rue Victor Hugo",
    "ligne2": null,
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

**⚠️ Sauvegarder le `id` retourné pour les étapes suivantes.**

#### Étape 2 : Consulter le client créé

```bash
export CLIENT_ID="8a9204f5-aa42-47bc-9f04-17caab5deeee"

curl -X GET http://localhost:8080/v1/connaissance-clients/$CLIENT_ID \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "12 rue Victor Hugo",
    "ligne2": null,
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

#### Étape 3 : Modifier le client (déménagement + mariage)

```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/$CLIENT_ID \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "25 avenue des Champs-Elysees",
      "codePostal": "75008",
      "ville": "Paris"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 0
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "25 avenue des Champs-Elysees",
    "ligne2": null,
    "codePostal": "75008",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 0
}
```

**📊 Événement Kafka publié :**
```json
{
  "eventId": "123e4567-e89b-12d3-a456-426614174000",
  "eventType": "AdresseChanged",
  "timestamp": "2025-11-22T10:30:45.123Z",
  "clientId": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "oldAdresse": {
    "ligne1": "12 rue Victor Hugo",
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "newAdresse": {
    "ligne1": "25 avenue des Champs-Elysees",
    "codePostal": "75008",
    "ville": "Paris"
  }
}
```

#### Étape 4 : Changer uniquement l'adresse (correction)

```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/$CLIENT_ID/adresse \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "ligne1": "10 rue de la Paix",
    "codePostal": "75002",
    "ville": "Paris"
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "10 rue de la Paix",
    "ligne2": null,
    "codePostal": "75002",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 0
}
```

#### Étape 5 : Mettre à jour la situation familiale (naissance)

```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/$CLIENT_ID/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "10 rue de la Paix",
    "ligne2": null,
    "codePostal": "75002",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

**ℹ️ Aucun événement Kafka publié** (seule la situation a changé).

#### Étape 6 : Supprimer le client

```bash
curl -X DELETE http://localhost:8080/v1/connaissance-clients/$CLIENT_ID \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (204 No Content)**

#### Étape 7 : Vérifier la suppression

```bash
curl -X GET http://localhost:8080/v1/connaissance-clients/$CLIENT_ID \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (404 Not Found) :**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Client with ID 8a9204f5-aa42-47bc-9f04-17caab5deeee not found",
  "path": "/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee"
}
```

---

### Scénario 2 : Gestion d'une famille (évolution temporelle)

#### Phase 1 : Jeune célibataire sans enfant

```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Martin",
    "prenom": "Sophie",
    "adresse": {
      "ligne1": "5 rue de la République",
      "codePostal": "69001",
      "ville": "Lyon"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

#### Phase 2 : Mariage (modification situation uniquement)

```bash
export CLIENT_ID="<id-retourne>"

curl -X PATCH http://localhost:8080/v1/connaissance-clients/$CLIENT_ID/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 0
  }'
```

#### Phase 3 : Premier enfant

```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/$CLIENT_ID/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 1
  }'
```

#### Phase 4 : Deuxième enfant + déménagement (maison plus grande)

```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/$CLIENT_ID \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Martin",
    "prenom": "Sophie",
    "adresse": {
      "ligne1": "18 rue des Lilas",
      "ligne2": "Pavillon avec jardin",
      "codePostal": "69009",
      "ville": "Lyon"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }'
```

**📊 Événement Kafka publié** (adresse changée).

---

### Scénario 3 : Gestion d'erreurs et résilience

#### Cas 1 : Adresse invalide (code postal incompatible avec ville)

```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Durand",
    "prenom": "Pierre",
    "adresse": {
      "ligne1": "1 rue de Paris",
      "codePostal": "33000",
      "ville": "Paris"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (422 Unprocessable Entity) :**
```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Code postal 33000 incompatible avec la ville Paris. Vérification via API IGN échouée.",
  "path": "/v1/connaissance-clients"
}
```

#### Cas 2 : Circuit breaker ouvert (API IGN indisponible)

**Simulation :**
1. Arrêter l'API IGN ou forcer des erreurs
2. Faire 3+ requêtes consécutives qui échouent
3. Le circuit breaker s'ouvre (état OPEN)

```bash
# 4ème requête : circuit breaker OPEN, fallback activé
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Bernard",
    "prenom": "Luc",
    "adresse": {
      "ligne1": "8 avenue de la Liberté",
      "codePostal": "13001",
      "ville": "Marseille"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (201 Created) :**
```json
{
  "id": "new-client-id",
  "nom": "Bernard",
  "prenom": "Luc",
  "adresse": {
    "ligne1": "8 avenue de la Liberté",
    "codePostal": "13001",
    "ville": "Marseille"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

**⚠️ Adresse acceptée sans validation externe** (fallback).

**Health check :**
```bash
curl http://localhost:8080/actuator/health | jq '.components.apiIgnHealthIndicator'
```

**Réponse :**
```json
{
  "status": "UP",
  "details": {
    "circuitBreakerState": "OPEN",
    "failureRate": "100.0%",
    "slowCallRate": "0.0%",
    "bufferedCalls": 10,
    "failedCalls": 10,
    "slowCalls": 0,
    "notPermittedCalls": 5
  }
}
```

---

## 📖 Endpoints GET

### GET /v1/connaissance-clients (Liste tous les clients)

**Requête :**
```bash
curl -X GET http://localhost:8080/v1/connaissance-clients \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (200 OK) :**
```json
[
  {
    "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "ligne2": null,
      "codePostal": "33000",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  },
  {
    "id": "7b8103e4-99b1-36ab-8e03-16b99a4cdddd",
    "nom": "Martin",
    "prenom": "Sophie",
    "adresse": {
      "ligne1": "5 rue de la République",
      "ligne2": null,
      "codePostal": "69001",
      "ville": "Lyon"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }
]
```

**Si aucun client :**
```json
[]
```

### GET /v1/connaissance-clients/{id} (Consulter un client spécifique)

**Requête :**
```bash
curl -X GET http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "12 rue Victor Hugo",
    "ligne2": null,
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

**Erreur 404 (client inexistant) :**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Client with ID unknown-id not found",
  "path": "/v1/connaissance-clients/unknown-id"
}
```

---

## ✏️ Endpoints POST

### POST /v1/connaissance-clients (Créer un nouveau client)

#### Exemple 1 : Client célibataire sans enfant

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Lefebvre",
    "prenom": "Marie",
    "adresse": {
      "ligne1": "3 boulevard de la Mer",
      "codePostal": "06000",
      "ville": "Nice"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (201 Created) :**
```json
{
  "id": "generated-uuid",
  "nom": "Lefebvre",
  "prenom": "Marie",
  "adresse": {
    "ligne1": "3 boulevard de la Mer",
    "ligne2": null,
    "codePostal": "06000",
    "ville": "Nice"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

#### Exemple 2 : Couple marié avec enfants et ligne2

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Rousseau",
    "prenom": "Thomas",
    "adresse": {
      "ligne1": "15 rue de la Fontaine",
      "ligne2": "Appartement 12B",
      "codePostal": "59000",
      "ville": "Lille"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 3
  }'
```

**Réponse (201 Created) :**
```json
{
  "id": "generated-uuid",
  "nom": "Rousseau",
  "prenom": "Thomas",
  "adresse": {
    "ligne1": "15 rue de la Fontaine",
    "ligne2": "Appartement 12B",
    "codePostal": "59000",
    "ville": "Lille"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 3
}
```

#### Exemple 3 : Parent célibataire (famille monoparentale)

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Lambert",
    "prenom": "Julie",
    "adresse": {
      "ligne1": "7 place de la Mairie",
      "codePostal": "44000",
      "ville": "Nantes"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 1
  }'
```

**Réponse (201 Created) :**
```json
{
  "id": "generated-uuid",
  "nom": "Lambert",
  "prenom": "Julie",
  "adresse": {
    "ligne1": "7 place de la Mairie",
    "ligne2": null,
    "codePostal": "44000",
    "ville": "Nantes"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 1
}
```

**✅ Règle métier validée** : Un célibataire peut avoir des enfants.

---

## 🔄 Endpoints PUT

### PUT /v1/connaissance-clients/{id} (Modifier complètement un client)

#### Exemple 1 : Modification globale (déménagement + mariage)

**Requête :**
```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "25 avenue des Champs-Elysees",
      "codePostal": "75008",
      "ville": "Paris"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "25 avenue des Champs-Elysees",
    "ligne2": null,
    "codePostal": "75008",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

**📊 Événement Kafka publié** (adresse changée de Bordeaux à Paris).

#### Exemple 2 : Modification sans changement d'adresse

**Requête :**
```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "25 avenue des Champs-Elysees",
      "codePostal": "75008",
      "ville": "Paris"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 3
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "25 avenue des Champs-Elysees",
    "ligne2": null,
    "codePostal": "75008",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 3
}
```

**ℹ️ Aucun événement Kafka publié** (adresse identique).

#### Exemple 3 : Changement de nom (mariage)

**Requête :**
```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/7b8103e4-99b1-36ab-8e03-16b99a4cdddd \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Martin-Dubois",
    "prenom": "Sophie",
    "adresse": {
      "ligne1": "5 rue de la République",
      "codePostal": "69001",
      "ville": "Lyon"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 0
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "7b8103e4-99b1-36ab-8e03-16b99a4cdddd",
  "nom": "Martin-Dubois",
  "prenom": "Sophie",
  "adresse": {
    "ligne1": "5 rue de la République",
    "ligne2": null,
    "codePostal": "69001",
    "ville": "Lyon"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 0
}
```

---

## 🔧 Endpoints PATCH

### PATCH /v1/connaissance-clients/{id}/adresse (Changer uniquement l'adresse)

#### Exemple 1 : Déménagement simple

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/adresse \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "ligne1": "10 rue de la Paix",
    "codePostal": "75002",
    "ville": "Paris"
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "10 rue de la Paix",
    "ligne2": null,
    "codePostal": "75002",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

**📊 Événement Kafka publié**.

#### Exemple 2 : Ajout ligne2 (complément d'adresse)

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/adresse \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "ligne1": "10 rue de la Paix",
    "ligne2": "Batiment B - Etage 3",
    "codePostal": "75002",
    "ville": "Paris"
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "10 rue de la Paix",
    "ligne2": "Batiment B - Etage 3",
    "codePostal": "75002",
    "ville": "Paris"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

#### Exemple 3 : Correction d'adresse

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/adresse \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "ligne1": "12 rue de la Paix",
    "codePostal": "75002",
    "ville": "Paris"
  }'
```

**Use case** : Correction d'un numéro de rue erroné (10 → 12).

### PATCH /v1/connaissance-clients/{id}/situation (Changer situation familiale)

#### Exemple 1 : Mariage

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/7b8103e4-99b1-36ab-8e03-16b99a4cdddd/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 0
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "7b8103e4-99b1-36ab-8e03-16b99a4cdddd",
  "nom": "Martin",
  "prenom": "Sophie",
  "adresse": {
    "ligne1": "5 rue de la République",
    "ligne2": null,
    "codePostal": "69001",
    "ville": "Lyon"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 0
}
```

#### Exemple 2 : Naissance d'enfants

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/7b8103e4-99b1-36ab-8e03-16b99a4cdddd/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "7b8103e4-99b1-36ab-8e03-16b99a4cdddd",
  "nom": "Martin",
  "prenom": "Sophie",
  "adresse": {
    "ligne1": "5 rue de la République",
    "ligne2": null,
    "codePostal": "69001",
    "ville": "Lyon"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}
```

#### Exemple 3 : Divorce avec garde d'enfants

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/7b8103e4-99b1-36ab-8e03-16b99a4cdddd/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "DIVORCE",
    "nombreEnfants": 2
  }'
```

**Réponse (200 OK) :**
```json
{
  "id": "7b8103e4-99b1-36ab-8e03-16b99a4cdddd",
  "nom": "Martin",
  "prenom": "Sophie",
  "adresse": {
    "ligne1": "5 rue de la République",
    "ligne2": null,
    "codePostal": "69001",
    "ville": "Lyon"
  },
  "situationFamiliale": "DIVORCE",
  "nombreEnfants": 2
}
```

#### Exemple 4 : PACS

**Requête :**
```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/client-id/situation \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "situationFamiliale": "PACSE",
    "nombreEnfants": 1
  }'
```

---

## 🗑️ Endpoints DELETE

### DELETE /v1/connaissance-clients/{id} (Supprimer un client)

**Requête :**
```bash
curl -X DELETE http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (204 No Content)**

**Vérification :**
```bash
curl -X GET http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (404 Not Found) :**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Client with ID 8a9204f5-aa42-47bc-9f04-17caab5deeee not found"
}
```

---

## ❌ Cas d'erreur

### Erreur 400 : Bad Request (validation échouée)

#### Cas 1 : Champ obligatoire manquant

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "33000",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (400 Bad Request) :**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "prenom",
      "message": "must not be null"
    }
  ]
}
```

#### Cas 2 : Format invalide (code postal)

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "ABC",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (400 Bad Request) :**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "adresse.codePostal",
      "message": "must match \"^[0-9]{5}$\""
    }
  ]
}
```

#### Cas 3 : Valeur hors limites (nombreEnfants)

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "33000",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 25
  }'
```

**Réponse (400 Bad Request) :**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "nombreEnfants",
      "message": "must be between 0 and 20"
    }
  ]
}
```

### Erreur 404 : Not Found (client inexistant)

**Requête :**
```bash
curl -X GET http://localhost:8080/v1/connaissance-clients/unknown-id \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (404 Not Found) :**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Client with ID unknown-id not found",
  "path": "/v1/connaissance-clients/unknown-id"
}
```

### Erreur 422 : Unprocessable Entity (adresse invalide)

**Requête :**
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $(uuidgen)" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "75008",
      "ville": "Bordeaux"
    },
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'
```

**Réponse (422 Unprocessable Entity) :**
```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Code postal 75008 incompatible avec la ville Bordeaux. Vérification via API IGN échouée.",
  "path": "/v1/connaissance-clients"
}
```

### Erreur 500 : Internal Server Error

**Requête :**
```bash
# MongoDB arrêté ou inaccessible
curl -X GET http://localhost:8080/v1/connaissance-clients \
  -H "X-Correlation-ID: $(uuidgen)"
```

**Réponse (500 Internal Server Error) :**
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/v1/connaissance-clients"
}
```

---

## 📦 Collection Postman

### Import de la collection

**Fichier JSON :**

Créer `Connaissance-Client-API.postman_collection.json` :

```json
{
  "info": {
    "name": "Connaissance Client API",
    "description": "Collection complète pour tester l'API Connaissance Client",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080",
      "type": "string"
    },
    {
      "key": "client_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Clients",
      "item": [
        {
          "name": "1. Créer un client",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "var jsonData = pm.response.json();",
                  "pm.collectionVariables.set(\"client_id\", jsonData.id);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nom\": \"Dupont\",\n  \"prenom\": \"Jean\",\n  \"adresse\": {\n    \"ligne1\": \"12 rue Victor Hugo\",\n    \"codePostal\": \"33000\",\n    \"ville\": \"Bordeaux\"\n  },\n  \"situationFamiliale\": \"CELIBATAIRE\",\n  \"nombreEnfants\": 0\n}"
            },
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients"]
            }
          }
        },
        {
          "name": "2. Lister tous les clients",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients"]
            }
          }
        },
        {
          "name": "3. Consulter un client",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients/{{client_id}}",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients", "{{client_id}}"]
            }
          }
        },
        {
          "name": "4. Modifier un client (PUT)",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nom\": \"Dupont\",\n  \"prenom\": \"Jean\",\n  \"adresse\": {\n    \"ligne1\": \"25 avenue des Champs-Elysees\",\n    \"codePostal\": \"75008\",\n    \"ville\": \"Paris\"\n  },\n  \"situationFamiliale\": \"MARIE\",\n  \"nombreEnfants\": 2\n}"
            },
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients/{{client_id}}",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients", "{{client_id}}"]
            }
          }
        },
        {
          "name": "5. Changer adresse (PATCH)",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"ligne1\": \"10 rue de la Paix\",\n  \"codePostal\": \"75002\",\n  \"ville\": \"Paris\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients/{{client_id}}/adresse",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients", "{{client_id}}", "adresse"]
            }
          }
        },
        {
          "name": "6. Changer situation (PATCH)",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"situationFamiliale\": \"MARIE\",\n  \"nombreEnfants\": 3\n}"
            },
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients/{{client_id}}/situation",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients", "{{client_id}}", "situation"]
            }
          }
        },
        {
          "name": "7. Supprimer un client",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "X-Correlation-ID",
                "value": "{{$guid}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/v1/connaissance-clients/{{client_id}}",
              "host": ["{{base_url}}"],
              "path": ["v1", "connaissance-clients", "{{client_id}}"]
            }
          }
        }
      ]
    },
    {
      "name": "Health & Monitoring",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/actuator/health",
              "host": ["{{base_url}}"],
              "path": ["actuator", "health"]
            }
          }
        },
        {
          "name": "Prometheus Metrics",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/actuator/prometheus",
              "host": ["{{base_url}}"],
              "path": ["actuator", "prometheus"]
            }
          }
        }
      ]
    }
  ]
}
```

### Import dans Postman

1. Ouvrir Postman
2. **Import** → **Upload Files**
3. Sélectionner `Connaissance-Client-API.postman_collection.json`
4. **Import**

### Variables de collection

| Variable | Valeur | Description |
|----------|--------|-------------|
| `base_url` | `http://localhost:8080` | URL de l'API |
| `client_id` | (auto) | ID client créé automatiquement |

### Tests automatisés Postman

La collection inclut des tests automatiques :

```javascript
// Test 1 : Créer un client
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

var jsonData = pm.response.json();
pm.collectionVariables.set("client_id", jsonData.id);

// Test 2 : Client a un ID
pm.test("Client has an ID", function () {
    pm.expect(jsonData.id).to.not.be.empty;
});
```

**Exécuter tous les tests :**
1. Collection → **Run**
2. **Run Connaissance Client API**
3. Vérifier résultats (7/7 tests passed)

---

## 📞 Support

**Questions** : Créer une issue sur GitHub/GitLab  
**Équipe** : SQLI - Data Lake Team  
**Email** : pbousquet@sqli.com  
**Documentation** : [Wiki interne](http://wiki.sqli.com/connaissance-client)

---

## 📚 Références

- [OpenAPI Specification](https://swagger.io/specification/)
- [Postman Learning Center](https://learning.postman.com/)
- [curl Documentation](https://curl.se/docs/)
- [HTTPie Documentation](https://httpie.io/docs)
- [README.md](../README.md) - Vue d'ensemble application
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture détaillée
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Guide développeur

---

**Version** : 2.0.0  
**Dernière mise à jour** : 22 novembre 2025  
**Auteur** : SQLI Data Lake Team
