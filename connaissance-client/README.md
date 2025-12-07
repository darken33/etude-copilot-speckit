# Connaissance Client - API REST

> API de gestion complète des fiches de connaissance client basée sur une architecture hexagonale (DDD)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![Kafka](https://img.shields.io/badge/Kafka-3.3-red.svg)](https://kafka.apache.org/)
[![Coverage](https://img.shields.io/badge/Coverage-87.4%25-brightgreen.svg)](https://www.jacoco.org/)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage rapide](#-démarrage-rapide)
- [API Reference](#-api-reference)
- [Monitoring & Observabilité](#-monitoring--observabilité)
- [Tests](#-tests)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Documentation](#-documentation)
- [Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

L'API **Connaissance Client** permet de gérer le cycle de vie complet des fiches clients avec :

### Fonctionnalités principales

- ✅ **CRUD complet** : Création, consultation, modification, suppression de fiches clients
- ✅ **Validation externe** : Vérification des adresses via API IGN avec circuit breaker
- ✅ **Event-driven** : Publication d'événements Kafka pour changements d'adresse
- ✅ **Observabilité** : Métriques Prometheus, dashboard Grafana, alerting
- ✅ **Résilience** : Circuit breaker Resilience4j, fallback automatique
- ✅ **Audit trail** : Traçabilité complète avec MDC (userId, correlationId, clientId, operation)
- ✅ **Sécurité** : Authentification JWT, validation multi-niveaux
- ✅ **Tests** : 87.4% de couverture (unitaires + intégration + BDD)

### Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/v1/connaissance-clients` | Liste toutes les fiches clients |
| `GET` | `/v1/connaissance-clients/{id}` | Récupère une fiche client spécifique |
| `POST` | `/v1/connaissance-clients` | Crée une nouvelle fiche client |
| `PUT` | `/v1/connaissance-clients/{id}` | Modifie complètement une fiche client |
| `DELETE` | `/v1/connaissance-clients/{id}` | Supprime une fiche client |
| `PATCH` | `/v1/connaissance-clients/{id}/adresse` | Change uniquement l'adresse |
| `PATCH` | `/v1/connaissance-clients/{id}/situation` | Change la situation familiale |

### Technologies

- **Backend** : Spring Boot 3.5.0, Java 21
- **Persistence** : MongoDB 7.0
- **Messaging** : Apache Kafka 3.3
- **Observabilité** : Prometheus, Grafana, Spring Boot Actuator
- **Résilience** : Resilience4j Circuit Breaker
- **API** : OpenAPI 3.0, Spring REST
- **Tests** : JUnit 5, Mockito, Testcontainers, Karate

---

## 🏗️ Architecture

### Architecture Hexagonale (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│                      connaissance-client                     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │              connaissance-client-app                    │ │
│  │  (Configuration, Health Checks, Bootstrap)              │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│  ┌──────────────────▼──────────────┐                        │
│  │   connaissance-client-api       │  ← API Layer (REST)    │
│  │   (Controllers, DTOs, Delegate) │                        │
│  └──────────────────┬──────────────┘                        │
│                     │                                         │
│  ┌──────────────────▼──────────────┐                        │
│  │  connaissance-client-domain     │  ← Domain Layer (Core) │
│  │  (Services, Entities, Ports)    │                        │
│  └──────────┬───────────────┬──────┘                        │
│             │               │                                │
│  ┌──────────▼────┐  ┌──────▼──────────┐  ┌──────────────┐  │
│  │ db-adapter     │  │ cp-adapter      │  │ event-adapter│  │
│  │ (MongoDB)      │  │ (API IGN)       │  │ (Kafka)      │  │
│  └────────────────┘  └─────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Modules

| Module | Responsabilité |
|--------|----------------|
| `connaissance-client-app` | Configuration Spring Boot, point d'entrée, health checks |
| `connaissance-client-api` | Contrôleurs REST, DTOs, validation Bean Validation |
| `connaissance-client-domain` | Logique métier, entités DDD, services, ports |
| `connaissance-client-db-adapter` | Implémentation persistence MongoDB |
| `connaissance-client-cp-adapter` | Client API IGN avec circuit breaker |
| `connaissance-client-event-adapter` | Publication événements Kafka |

### Flux de données

```
Client HTTP
   │
   ▼
ConnaissanceClientApiController (REST)
   │
   ▼
ConnaissanceClientDelegate (Mapping DTO → Domain)
   │
   ▼
ConnaissanceClientService (Logique métier)
   │
   ├──► CodePostauxService (Validation API IGN)
   │       └──► Circuit Breaker (Résilience)
   │
   ├──► ConnaissanceClientRepository (MongoDB)
   │
   └──► AdresseEventService (Kafka)
```

---

## ⚙️ Prérequis

### Obligatoires

- **Java 21** (OpenJDK ou Oracle JDK)
- **Maven 3.9+**
- **MongoDB 7.0+** (local ou Docker)
- **Apache Kafka 3.3+** (local ou Docker)

### Recommandés

- **Docker Desktop** (pour environnement local complet)
- **Postman** ou **curl** (pour tester l'API)
- **Prometheus + Grafana** (pour monitoring)

### Vérification

```bash
java -version    # java version "21"
mvn -version     # Apache Maven 3.9.x
docker --version # Docker version 24.x
```

---

## 📦 Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd connaissance-client
```

### 2. Démarrer les services locaux (Docker)

```bash
# MongoDB
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=mongoadmin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7.0

# Kafka + Zookeeper
docker-compose -f tests/local_kafka/docker-compose.yml up -d
```

### 3. Compiler le projet

```bash
mvn clean install
```

### 4. Lancer l'application

```bash
cd connaissance-client-app
mvn spring-boot:run
```

**L'application démarre sur** : http://localhost:8080

---

## 🚀 Démarrage rapide

### 1. Créer un client

```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
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

**Réponse** :
```json
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "12 rue Victor Hugo",
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

### 2. Consulter un client

```bash
curl http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee
```

### 3. Modifier un client (modification globale)

```bash
curl -X PUT http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "adresse": {
      "ligne1": "25 avenue des Champs-Élysées",
      "codePostal": "75008",
      "ville": "Paris"
    },
    "situationFamiliale": "MARIE",
    "nombreEnfants": 2
  }'
```

**→ Un événement Kafka est publié** car l'adresse a changé.

### 4. Changer uniquement l'adresse

```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/adresse \
  -H "Content-Type: application/json" \
  -d '{
    "ligne1": "10 rue de la Paix",
    "codePostal": "75002",
    "ville": "Paris"
  }'
```

### 5. Changer la situation familiale

```bash
curl -X PATCH http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee/situation \
  -H "Content-Type: application/json" \
  -d '{
    "situationFamiliale": "DIVORCE",
    "nombreEnfants": 2
  }'
```

### 6. Supprimer un client

```bash
curl -X DELETE http://localhost:8080/v1/connaissance-clients/8a9204f5-aa42-47bc-9f04-17caab5deeee
```

### 7. Lister tous les clients

```bash
curl http://localhost:8080/v1/connaissance-clients
```

---

## 📚 API Reference

### Documentation OpenAPI

**Accès** : http://localhost:8080/v3/api-docs  
**Swagger UI** : http://localhost:8080/swagger-ui.html

Voir le fichier complet : [`connaissance-client-api.yaml`](connaissance-client-api/src/main/resources/connaissance-client-api.yaml)

### Codes de réponse HTTP

| Code | Signification | Cas d'usage |
|------|---------------|-------------|
| `200 OK` | Succès | Modification, consultation réussie |
| `201 Created` | Créé | Nouvelle fiche client créée |
| `204 No Content` | Succès sans contenu | Suppression réussie |
| `400 Bad Request` | Requête invalide | Validation échouée, format JSON incorrect |
| `404 Not Found` | Ressource introuvable | Client inexistant |
| `422 Unprocessable Entity` | Entité non traitable | Adresse invalide (API IGN) |
| `500 Internal Server Error` | Erreur serveur | Erreur inattendue |
| `503 Service Unavailable` | Service indisponible | Circuit breaker ouvert |

### Headers requis

| Header | Obligatoire | Description |
|--------|-------------|-------------|
| `Content-Type` | Oui (POST/PUT/PATCH) | `application/json` |
| `Authorization` | Oui (prod) | `Bearer <JWT_TOKEN>` |
| `X-Correlation-ID` | Recommandé | UUID pour traçabilité |

### Validation des données

#### Contraintes sur les champs

- **nom** : 2-50 caractères, lettres uniquement
- **prenom** : 2-50 caractères, lettres uniquement
- **codePostal** : 5 chiffres (format français)
- **ville** : 2-50 caractères
- **situationFamiliale** : `CELIBATAIRE`, `MARIE`, `DIVORCE`, `VEUF`, `PACSE`
- **nombreEnfants** : 0-20

#### Validation externe (API IGN)

Le code postal et la ville sont validés via l'API IGN :
- URL : `https://apicarto.ign.fr/api/codes-postaux/communes/{codePostal}`
- Circuit breaker : 3 échecs consécutifs → skip validation 60s
- Fallback : Accepte l'adresse sans validation externe

---

## 📊 Monitoring & Observabilité

### Endpoints Actuator

| Endpoint | Description |
|----------|-------------|
| [`/actuator/health`](http://localhost:8080/actuator/health) | État de l'application + circuit breaker |
| [`/actuator/prometheus`](http://localhost:8080/actuator/prometheus) | Métriques Prometheus |
| [`/actuator/info`](http://localhost:8080/actuator/info) | Informations application |

### Health Check

```bash
curl http://localhost:8080/actuator/health | jq
```

**Réponse** :
```json
{
  "status": "UP",
  "components": {
    "apiIgnHealthIndicator": {
      "status": "UP",
      "details": {
        "circuitBreakerState": "CLOSED",
        "failureRate": "0.0%",
        "slowCallRate": "0.0%"
      }
    },
    "mongo": {
      "status": "UP"
    }
  }
}
```

### Métriques Prometheus

```bash
curl http://localhost:8080/actuator/prometheus | grep resilience4j
```

**Métriques clés** :
- `resilience4j_circuitbreaker_state` : État du circuit (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `resilience4j_circuitbreaker_failure_rate` : Taux d'échec
- `resilience4j_circuitbreaker_slow_call_rate` : Taux d'appels lents
- `http_server_requests_seconds` : Latence HTTP (p50, p95, p99)

### Dashboard Grafana

**Fichier** : [`docs/monitoring/grafana-modifier-client.json`](docs/monitoring/grafana-modifier-client.json)

**Import** :
1. Grafana UI > Dashboards > Import
2. Upload `grafana-modifier-client.json`
3. Sélectionner data source Prometheus

**Panneaux** :
- État circuit breaker (temps réel)
- Taux d'échec et d'appels lents
- Latence p50/p95/p99 par endpoint
- Distribution codes HTTP
- Événements Kafka
- Mémoire JVM

### Alertes Prometheus

**Fichier** : [`docs/monitoring/alerts.yml`](docs/monitoring/alerts.yml)

**Alertes configurées** :
- 🔴 **Critical** : Circuit breaker ouvert > 2min, service down > 1min
- 🟡 **Warning** : Taux erreur 5xx > 5%, latence p95 > 2s, heap > 85%
- ℹ️ **Info** : Taux HTTP 422 > 30%

**Installation** :
```yaml
# prometheus.yml
rule_files:
  - "/etc/prometheus/rules/alerts.yml"
```

### Logs structurés (MDC)

Tous les logs incluent :
- `userId` : Identifiant utilisateur (JWT)
- `correlationId` : Traçabilité end-to-end
- `clientId` : ID du client concerné
- `operation` : Opération métier

**Exemple** :
```
2025-11-22 10:30:45.123 [main] INFO c.s.w.d.c.c.d.ConnaissanceClientServiceImpl 
[userId=user@sqli.com] [correlationId=123e4567-e89b-12d3-a456-426614174000] 
[clientId=8a9204f5-aa42-47bc-9f04-17caab5deeee] [operation=modifierClient] 
- Client 8a9204f5-aa42-47bc-9f04-17caab5deeee updated successfully. Address changed: true
```

---

## 🧪 Tests

### Exécuter tous les tests

```bash
mvn clean verify
```

### Tests unitaires uniquement

```bash
mvn test
```

### Tests d'intégration uniquement

```bash
mvn failsafe:integration-test
```

### Couverture de code (JaCoCo)

```bash
mvn jacoco:report
open target/site/jacoco/index.html
```

**Couverture actuelle** : **87.4%**

### Tests BDD (Karate)

```bash
cd tests/connaissance-client-karate
mvn test
```

### Structure des tests

```
src/test/java/
├── domain/
│   └── ConnaissanceClientServiceImplTest.java    (4 tests unitaires)
├── api/
│   └── ConnaissanceClientDelegateTest.java       (5 tests unitaires)
└── integration/
    ├── ModifierClientIntegrationTest.java        (3 tests intégration)
    └── CircuitBreakerIntegrationTest.java        (2 tests résilience)
```

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SPRING_PROFILES_ACTIVE` | `default` | Profil Spring (dev, prod) |
| `SERVER_PORT` | `8080` | Port HTTP |
| `MONGODB_URI` | `mongodb://localhost:27017` | URL MongoDB |
| `MONGODB_DATABASE` | `connaissancedb` | Base MongoDB |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Serveurs Kafka |
| `API_IGN_BASE_URL` | `https://apicarto.ign.fr` | URL API IGN |

### Fichiers de configuration

- [`application.yml`](connaissance-client-app/src/main/resources/application.yml) : Configuration principale
- [`logback-spring.xml`](connaissance-client-app/src/main/resources/logback-spring.xml) : Configuration logs
- [`connaissance-client-api.yaml`](connaissance-client-api/src/main/resources/connaissance-client-api.yaml) : Spécification OpenAPI

### Profils Spring Boot

**Profil `dev`** :
```yaml
spring:
  profiles:
    active: dev
logging:
  level:
    root: DEBUG
```

**Profil `prod`** :
```yaml
spring:
  profiles:
    active: prod
resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        failureRateThreshold: 20  # Plus strict en prod
```

---

## 🚢 Déploiement

### Docker

#### Build de l'image

```bash
mvn clean package
docker build -t connaissance-client:2.0.0 .
```

#### Run du container

```bash
docker run -d \
  --name connaissance-client \
  -p 8080:8080 \
  -e MONGODB_URI=mongodb://mongodb:27017 \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  connaissance-client:2.0.0
```

### Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: mongoadmin
      MONGO_INITDB_ROOT_PASSWORD: secret
  
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
  
  connaissance-client:
    image: connaissance-client:2.0.0
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - kafka
    environment:
      MONGODB_URI: mongodb://mongodb:27017
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
```

```bash
docker-compose up -d
```

### Kubernetes (Helm)

```bash
helm install connaissance-client ./k8s/helm-chart \
  --set image.tag=2.0.0 \
  --set mongodb.uri=mongodb://mongodb-svc:27017 \
  --set kafka.bootstrapServers=kafka-svc:9092
```

### Native Image (GraalVM)

```bash
mvn clean package -Pnative
./connaissance-client-app/target/connaissance-client-app
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |
| [OpenAPI Spec](connaissance-client-api/src/main/resources/connaissance-client-api.yaml) | Spécification API complète |
| [Migration Guide](docs/migration/PUT-modifier-client.md) | Guide migration v2.0.0 |
| [Architecture Decision Records](architecture/) | Décisions d'architecture |
| [Grafana Dashboard](docs/monitoring/grafana-modifier-client.json) | Dashboard monitoring |
| [Prometheus Alerts](docs/monitoring/alerts.yml) | Règles d'alerting |

---

## 🤝 Contribution

### Conventions de code

- **Style** : [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- **Formatage** : `mvn spotless:apply`
- **Linting** : `mvn checkstyle:check`

### Workflow Git

```bash
# 1. Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer et tester
mvn clean verify

# 3. Commit avec message conventionnel
git commit -m "feat: ajout endpoint GET /v2/clients"

# 4. Push et créer Pull Request
git push origin feature/nouvelle-fonctionnalite
```

### Commits conventionnels

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Maintenance

---

## 📞 Support

**Équipe** : SQLI  
**Email** : pbousquet@sqli.com  
**Documentation** : [Wiki interne](http://wiki.sqli.com/connaissance-client)

---

## 📄 License

Copyright (c) 2025 SQLI. Tous droits réservés.

---

**Version** : 2.0.0  
**Dernière mise à jour** : 22 novembre 2025
