# Architecture Globale - Connaissance Client

> Documentation d'architecture détaillée du système de gestion de fiches clients

[![Architecture](https://img.shields.io/badge/Architecture-Hexagonale-blue.svg)](https://alistair.cockburn.us/hexagonal-architecture/)
[![DDD](https://img.shields.io/badge/Pattern-DDD-green.svg)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
[![Event Driven](https://img.shields.io/badge/Messaging-Event%20Driven-orange.svg)](https://martinfowler.com/articles/201701-event-driven.html)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture hexagonale](#-architecture-hexagonale)
- [Modules et découpage](#-modules-et-découpage)
- [Flux de données](#-flux-de-données)
- [Intégrations externes](#-intégrations-externes)
- [Modèle de données](#-modèle-de-données)
- [Événements et messaging](#-événements-et-messaging)
- [Sécurité](#-sécurité)
- [Résilience et tolérance aux pannes](#-résilience-et-tolérance-aux-pannes)
- [Observabilité](#-observabilité)
- [Décisions d'architecture](#-décisions-darchitecture)

---

## 🎯 Vue d'ensemble

### Contexte métier

L'application **Connaissance Client** est un système de gestion de fiches clients conçu pour :

- **Centraliser** les informations clients (identité, adresse, situation familiale)
- **Valider** les données via des services externes (API IGN pour les adresses)
- **Tracer** toutes les modifications pour audit et conformité RGPD
- **Publier** des événements métier pour notifier d'autres systèmes
- **Garantir** la disponibilité et la résilience face aux pannes

### Principes architecturaux

L'architecture repose sur 5 principes fondamentaux :

1. **Hexagonal Architecture** (Ports & Adapters)
   - Domaine métier isolé et indépendant des frameworks
   - Inversion de dépendances via des ports (interfaces)
   - Adapters interchangeables (MongoDB ↔ PostgreSQL, Kafka ↔ RabbitMQ)

2. **Domain-Driven Design (DDD)**
   - Langage ubiquitaire : `ConnaissanceClient`, `Adresse`, `SituationFamiliale`
   - Agrégat racine : `ConnaissanceClient`
   - Services métier encapsulent la logique complexe

3. **Event-Driven Architecture**
   - Événements de domaine : `AdresseChangedEvent`
   - Communication asynchrone via Kafka
   - Découplage entre producteurs et consommateurs

4. **Microservices-Ready**
   - Déployable indépendamment (Docker, Kubernetes)
   - API REST bien définie (OpenAPI 3.0)
   - Base de données dédiée (MongoDB)

5. **Resilience by Design**
   - Circuit breaker pour API externe (Resilience4j)
   - Fallback automatique si API IGN indisponible
   - Health checks et métriques Prometheus

### Caractéristiques techniques

| Dimension | Capacité cible |
|-----------|----------------|
| **Throughput** | 100-500 req/s |
| **Latence p95** | < 500ms |
| **Latence p99** | < 2s |
| **Disponibilité** | 99.5% (SLA) |
| **Volumétrie** | 1M+ clients |
| **Durée de rétention** | Illimitée (audit) |

---

## 🏗️ Architecture hexagonale

### Vue globale

L'architecture hexagonale (ou "Ports & Adapters") organise le code en 3 zones concentriques :

```
┌───────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE                                │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │                    PRIMARY ADAPTERS                         │      │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │      │
│  │  │  REST API      │  │   GraphQL      │  │   gRPC       │  │      │
│  │  │  (Controllers) │  │   (Resolvers)  │  │   (Service)  │  │      │
│  │  └───────┬────────┘  └───────┬────────┘  └──────┬───────┘  │      │
│  └──────────┼────────────────────┼───────────────────┼──────────┘      │
│             │                    │                   │                 │
│  ┌──────────▼────────────────────▼───────────────────▼──────────┐      │
│  │                         DOMAIN LAYER                         │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │         ConnaissanceClient (Aggregate Root)            │  │      │
│  │  │  - Entities : ConnaissanceClient, Adresse             │  │      │
│  │  │  - Value Objects : SituationFamiliale, CodePostal     │  │      │
│  │  │  - Services : ConnaissanceClientService               │  │      │
│  │  │  - Ports (Interfaces) :                               │  │      │
│  │  │    * ConnaissanceClientRepository                     │  │      │
│  │  │    * CodePostauxService                               │  │      │
│  │  │    * AdresseEventService                              │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  └──────────┬────────────────────┬───────────────────┬──────────┘      │
│             │                    │                   │                 │
│  ┌──────────▼────────────────────▼───────────────────▼──────────┐      │
│  │                    SECONDARY ADAPTERS                         │      │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐    │      │
│  │  │   MongoDB      │  │   API IGN      │  │    Kafka     │    │      │
│  │  │   Adapter      │  │   Adapter      │  │   Adapter    │    │      │
│  │  │  (Repository)  │  │ (Circuit Brkr) │  │  (Producer)  │    │      │
│  │  └────────────────┘  └────────────────┘  └──────────────┘    │      │
│  └─────────────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
                                   │
                      ┌────────────┴──────────┐
                      │   EXTERNAL SYSTEMS    │
                      │  - MongoDB            │
                      │  - API IGN            │
                      │  - Kafka Cluster      │
                      └───────────────────────┘
```

### Couche Domaine (Core)

**Responsabilités** :
- ✅ Logique métier pure (règles de validation, calculs)
- ✅ Définition des entités et value objects
- ✅ Déclaration des ports (interfaces)
- ❌ **AUCUNE** dépendance vers frameworks ou infrastructure

**Entités** :

```java
// Aggregate Root
@Data
@Builder
public class ConnaissanceClient {
  private String id;                           // UUID
  private String nom;                          // 2-50 caractères
  private String prenom;                       // 2-50 caractères
  private Adresse adresse;                     // Value Object
  private SituationFamiliale situationFamiliale; // Enum
  private Integer nombreEnfants;               // 0-20
  
  // Business logic
  public boolean hasAdresseChanged(ConnaissanceClient other) {
    return !Objects.equals(this.adresse, other.adresse);
  }
  
  public boolean isEligibleForFamilyDiscount() {
    return nombreEnfants >= 2;
  }
}

// Value Object
@Data
@AllArgsConstructor
public class Adresse {
  private String ligne1;      // Obligatoire
  private String ligne2;      // Optionnel
  private String codePostal;  // 5 chiffres
  private String ville;       // Validé via API IGN
}

// Enum
public enum SituationFamiliale {
  CELIBATAIRE,
  MARIE,
  DIVORCE,
  VEUF,
  PACSE
}
```

**Ports (interfaces)** :

```java
// Port sortant (driven) : Persistence
public interface ConnaissanceClientRepository {
  ConnaissanceClient save(ConnaissanceClient client);
  Optional<ConnaissanceClient> findById(String id);
  List<ConnaissanceClient> findAll();
  void deleteById(String id);
}

// Port sortant : Validation externe
public interface CodePostauxService {
  void validerAdresse(String codePostal, String ville);
}

// Port sortant : Événements
public interface AdresseEventService {
  void publishAdresseChangedEvent(ConnaissanceClient client);
}
```

### Couche API (Primary Adapter)

**Responsabilités** :
- ✅ Exposer les endpoints REST
- ✅ Valider les requêtes HTTP (Bean Validation)
- ✅ Mapper DTO ↔ Entité
- ✅ Gérer les erreurs HTTP (4xx, 5xx)

**Architecture 3-tier** :

```
Controller → Delegate → Service (Domain)
   │            │            │
   ├─ Routing   ├─ Mapping   ├─ Business Logic
   ├─ @Valid    ├─ DTO→Entity ├─ Validation métier
   └─ HTTP      └─ Entity→DTO └─ Orchestration
```

**Exemple** :

```java
// Controller (routing HTTP uniquement)
@RestController
@RequiredArgsConstructor
public class ConnaissanceClientApiController implements ConnaissanceClientApi {
  private final ConnaissanceClientDelegate delegate;
  
  @Override
  public ResponseEntity<ConnaissanceClientDto> modifierClient(
      @PathVariable String id,
      @Valid @RequestBody ModifierClientRequestDto request) {
    ConnaissanceClientDto response = delegate.modifierClient(id, request);
    return ResponseEntity.ok(response);
  }
}

// Delegate (mapping DTO ↔ Domain)
@Component
@RequiredArgsConstructor
public class ConnaissanceClientDelegate {
  private final ConnaissanceClientService service;
  private final ConnaissanceClientMapper mapper;
  
  public ConnaissanceClientDto modifierClient(String id, ModifierClientRequestDto dto) {
    // DTO → Domain
    ConnaissanceClient domainRequest = mapper.toDomain(dto);
    
    // Appel service métier
    ConnaissanceClient updated = service.modifierClient(id, domainRequest);
    
    // Domain → DTO
    return mapper.toDto(updated);
  }
}
```

### Couche Infrastructure (Secondary Adapters)

**Responsabilités** :
- ✅ Implémenter les ports du domaine
- ✅ Gérer la persistence (MongoDB)
- ✅ Appeler les services externes (API IGN)
- ✅ Publier les événements (Kafka)

**Pattern Adapter** :

```java
// Adapter MongoDB
@Repository
@RequiredArgsConstructor
public class ConnaissanceClientRepositoryAdapter implements ConnaissanceClientRepository {
  private final MongoConnaissanceClientRepository mongoRepository;
  private final ConnaissanceClientMongoMapper mapper;
  
  @Override
  public ConnaissanceClient save(ConnaissanceClient client) {
    ConnaissanceClientDocument doc = mapper.toDocument(client);
    ConnaissanceClientDocument saved = mongoRepository.save(doc);
    return mapper.toDomain(saved);
  }
}

// Adapter API IGN avec Circuit Breaker
@Service
@RequiredArgsConstructor
public class ApiIgnCodePostauxServiceAdapter implements CodePostauxService {
  private final RestTemplate restTemplate;
  
  @Override
  @CircuitBreaker(name = "apiIgn", fallbackMethod = "fallback")
  public void validerAdresse(String codePostal, String ville) {
    // Appel API IGN
    String url = "https://apicarto.ign.fr/api/codes-postaux/communes/" + codePostal;
    CommuneResponse[] communes = restTemplate.getForObject(url, CommuneResponse[].class);
    
    // Validation
    boolean valid = Arrays.stream(communes)
        .anyMatch(c -> c.getNomCommune().equalsIgnoreCase(ville));
    
    if (!valid) {
      throw new AdresseInvalideException("Code postal incompatible");
    }
  }
  
  // Fallback : accepte sans validation
  private void fallback(String codePostal, String ville, Exception ex) {
    log.warn("Circuit breaker open - skipping validation");
  }
}
```

---

## 📦 Modules et découpage

### Structure Maven Multi-Module

```
connaissance-client (parent)
├── pom.xml                              # Parent POM
├── connaissance-client-app/             # Module 1 : Application
│   ├── src/main/java/
│   │   └── com/sqli/.../ConnaissanceClientApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml              # Configuration
│   │   └── logback-spring.xml           # Logs
│   └── pom.xml
│
├── connaissance-client-api/             # Module 2 : API REST
│   ├── src/main/java/
│   │   ├── controller/                  # Controllers REST
│   │   ├── delegate/                    # Delegates (mapping)
│   │   ├── dto/                         # DTOs Request/Response
│   │   ├── mapper/                      # MapStruct mappers
│   │   └── exception/                   # Exception handlers
│   ├── src/main/resources/
│   │   └── connaissance-client-api.yaml # OpenAPI spec
│   └── pom.xml
│
├── connaissance-client-domain/          # Module 3 : Domaine métier
│   ├── src/main/java/
│   │   ├── model/                       # Entités, Value Objects
│   │   ├── service/                     # Services métier
│   │   ├── port/                        # Ports (interfaces)
│   │   └── exception/                   # Exceptions métier
│   └── pom.xml
│
├── connaissance-client-db-adapter/      # Module 4 : Persistence MongoDB
│   ├── src/main/java/
│   │   ├── document/                    # Documents MongoDB
│   │   ├── repository/                  # Spring Data repositories
│   │   ├── adapter/                     # Implémentation ports
│   │   └── mapper/                      # Mappers Entity ↔ Document
│   └── pom.xml
│
├── connaissance-client-cp-adapter/      # Module 5 : Client API IGN
│   ├── src/main/java/
│   │   ├── client/                      # RestTemplate client
│   │   ├── dto/                         # DTOs API IGN
│   │   ├── adapter/                     # Implémentation port
│   │   └── config/                      # Configuration Circuit Breaker
│   └── pom.xml
│
└── connaissance-client-event-adapter/   # Module 6 : Événements Kafka
    ├── src/main/java/
    │   ├── producer/                    # KafkaTemplate producer
    │   ├── event/                       # Event DTOs
    │   ├── adapter/                     # Implémentation port
    │   └── config/                      # Configuration Kafka
    └── pom.xml
```

### Dépendances entre modules

```
┌─────────────────────────────────────────────────────────────┐
│                 connaissance-client-app                      │
│          (Point d'entrée Spring Boot)                        │
└───┬─────────────────────┬──────────────────┬────────────────┘
    │                     │                  │
    ▼                     ▼                  ▼
┌───────────────┐  ┌──────────────┐  ┌────────────────────┐
│ api           │  │ domain       │  │ db-adapter         │
│ (Controllers) │  │ (Core)       │  │ (MongoDB)          │
└───┬───────────┘  └──┬───────────┘  └────────────────────┘
    │                 │
    │                 │      ┌────────────────────┐
    └────────┬────────┘      │ cp-adapter         │
             │               │ (API IGN)          │
             │               └────────────────────┘
             │               ┌────────────────────┐
             └──────────────►│ event-adapter      │
                             │ (Kafka)            │
                             └────────────────────┘
```

**Règles de dépendances** :

| Module | Dépend de | Ne dépend JAMAIS de |
|--------|-----------|---------------------|
| **domain** | Aucun module | api, adapters |
| **api** | domain | adapters |
| **db-adapter** | domain | api, other adapters |
| **cp-adapter** | domain | api, other adapters |
| **event-adapter** | domain | api, other adapters |
| **app** | Tous | - |

---

## 🔄 Flux de données

### Flux 1 : Création d'un client (POST)

```
┌─────────┐     ┌────────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Client  │────►│ Controller │────►│ Delegate │────►│ Service  │────►│ MongoDB │
│  HTTP   │     │   (API)    │     │  (API)   │     │ (Domain) │     │   DB    │
└─────────┘     └────────────┘     └──────────┘     └────┬─────┘     └─────────┘
                                                          │
                                                          ▼
                                                    ┌──────────┐
                                                    │ API IGN  │
                                                    │ (Valid.) │
                                                    └──────────┘

Étapes :
1. HTTP POST /v1/connaissance-clients + JSON body
2. Controller valide @Valid (Bean Validation)
3. Delegate mappe DTO → Entity
4. Service valide l'adresse via API IGN
5. Service sauvegarde en MongoDB
6. Service retourne l'entité créée
7. Delegate mappe Entity → DTO
8. Controller retourne HTTP 201 Created
```

### Flux 2 : Modification avec changement d'adresse (PUT)

```
┌─────────┐     ┌────────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Client  │────►│ Controller │────►│ Delegate │────►│ Service  │────►│ MongoDB │
│  HTTP   │     │   (API)    │     │  (API)   │     │ (Domain) │     │   DB    │
└─────────┘     └────────────┘     └──────────┘     └────┬─────┘     └─────────┘
                                                          │
                                                          ├──────────►┌──────────┐
                                                          │           │ API IGN  │
                                                          │           │ (Valid.) │
                                                          │           └──────────┘
                                                          │
                                                          └──────────►┌──────────┐
                                                                      │  Kafka   │
                                                                      │ (Event)  │
                                                                      └──────────┘

Étapes :
1. HTTP PUT /v1/connaissance-clients/{id} + JSON body
2. Controller valide @Valid
3. Delegate mappe DTO → Entity
4. Service récupère le client existant (MongoDB)
5. Service valide la nouvelle adresse (API IGN)
6. Service compare les adresses (before vs after)
7. Service sauvegarde les modifications (MongoDB)
8. SI adresse changée → Service publie événement Kafka
9. Delegate mappe Entity → DTO
10. Controller retourne HTTP 200 OK
```

### Flux 3 : Circuit Breaker en action (API IGN indisponible)

```
┌─────────┐     ┌──────────┐     ┌────────────────┐
│ Service │────►│ API IGN  │     │ Circuit Breaker│
│ (Domain)│     │ Adapter  │     │   (Closed)     │
└─────────┘     └────┬─────┘     └────────────────┘
                     │
                     ▼ Appel 1 : Success
                ┌─────────┐
                │ API IGN │ HTTP 200 OK
                └─────────┘
                     │
                     ▼ Appel 2 : Timeout (3s)
                ┌─────────┐
                │ API IGN │ ⏱️ Timeout
                └─────────┘
                     │
                     ▼ Appel 3 : Timeout
                ┌─────────┐
                │ API IGN │ ⏱️ Timeout
                └─────────┘
                     │
                     ▼ 3 échecs consécutifs
            ┌────────────────┐
            │ Circuit Breaker│
            │     OPEN       │ ⛔ Bloque les appels
            └────────────────┘
                     │
                     ▼ Appels suivants pendant 60s
                ┌──────────┐
                │ Fallback │ ✅ Accepte sans validation
                └──────────┘
                     │
                     ▼ Après 60s : HALF_OPEN
                ┌─────────┐
                │ API IGN │ 🧪 Test de récupération
                └─────────┘

États du Circuit Breaker :
- CLOSED (fermé) : Appels normaux vers API IGN
- OPEN (ouvert) : Fallback automatique (skip validation)
- HALF_OPEN (semi-ouvert) : Test de récupération après délai
```

### Flux 4 : Événement Kafka (changement d'adresse)

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│ ConnaissanceClient│────►│ AdresseEventService│────►│ KafkaProducer│
│    Service        │     │   (Event Adapter)  │     │   (Kafka)    │
└──────────────────┘     └───────────────────┘     └──────┬───────┘
                                                           │
                                                           ▼
                                           ┌───────────────────────────┐
                                           │  Kafka Topic              │
                                           │  "connaissance-client-    │
                                           │   events"                 │
                                           └──────┬────────────────────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────┐
                        │                         │                     │
                        ▼                         ▼                     ▼
                ┌──────────────┐        ┌──────────────┐      ┌──────────────┐
                │ Consumer 1   │        │ Consumer 2   │      │ Consumer 3   │
                │ (Analytics)  │        │ (CRM Sync)   │      │ (Notif Mail) │
                └──────────────┘        └──────────────┘      └──────────────┘

Format de l'événement (JSON) :
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

---

## 🔌 Intégrations externes

### 1. MongoDB (Base de données)

**Type** : NoSQL Document Store  
**Version** : 7.0+  
**Usage** : Persistence des fiches clients

**Collection** : `connaissanceClients`

**Document structure** :

```json
{
  "_id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": {
    "ligne1": "12 rue Victor Hugo",
    "ligne2": null,
    "codePostal": "33000",
    "ville": "Bordeaux"
  },
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2,
  "_class": "com.sqli.west.datalake.connaissanceclient.dbadapter.document.ConnaissanceClientDocument"
}
```

**Index** :

```javascript
// Index sur le nom pour recherche rapide
db.connaissanceClients.createIndex({ "nom": 1, "prenom": 1 })

// Index sur le code postal pour recherche géographique
db.connaissanceClients.createIndex({ "adresse.codePostal": 1 })
```

**Configuration** :

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017
      database: connaissancedb
      auto-index-creation: true
```

**Scalabilité** :
- ✅ Sharding par `_id` (UUID distribué)
- ✅ Replica Set 3 nodes (HA)
- ✅ Read preference: `SECONDARY_PREFERRED`

### 2. API IGN (Validation d'adresses)

**Type** : API REST publique  
**URL** : `https://apicarto.ign.fr/api/codes-postaux/communes/{codePostal}`  
**Usage** : Validation code postal ↔ ville

**Exemple de requête** :

```bash
GET https://apicarto.ign.fr/api/codes-postaux/communes/33000
```

**Réponse** :

```json
[
  {
    "codePostal": "33000",
    "nomCommune": "Bordeaux",
    "codeCommune": "33063",
    "libelleAcheminement": "BORDEAUX",
    "ligne5": "33000 BORDEAUX"
  }
]
```

**Contraintes** :
- ⏱️ Latence moyenne : 200-500ms
- 🔄 Limite : Aucune (API publique gratuite)
- ⚠️ Disponibilité : ~99% (pas de SLA garanti)

**Résilience** :

```yaml
resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        failureRateThreshold: 30           # Ouvre si 30% d'échecs
        slowCallRateThreshold: 50          # Ouvre si 50% d'appels lents
        slowCallDurationThreshold: 3s      # Seuil "lent"
        slidingWindowSize: 10              # Fenêtre de 10 appels
        waitDurationInOpenState: 60s       # Reste ouvert 60s
        permittedNumberOfCallsInHalfOpenState: 5  # Test 5 appels
```

**Fallback strategy** :
- ✅ Accepte l'adresse sans validation externe
- ⚠️ Log un warning pour monitoring
- 📊 Métrique Prometheus `circuit_breaker_open_count`

### 3. Apache Kafka (Événements)

**Type** : Plateforme de streaming événementiel  
**Version** : 3.3+  
**Usage** : Publication événements métier

**Topic** : `connaissance-client-events`

**Configuration** :

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all                      # Confirmation par tous les brokers
      retries: 3                     # 3 tentatives si échec
      properties:
        enable.idempotence: true     # Évite les doublons
```

**Événements publiés** :

| Événement | Déclencheur | Contenu |
|-----------|-------------|---------|
| `AdresseChangedEvent` | PUT modifier-client (adresse changée) | clientId, oldAdresse, newAdresse |

**Partitioning** :
- Clé de partition : `clientId`
- Garantie d'ordre : Tous les événements d'un client dans la même partition

**Rétention** :
- Durée : 7 jours (configurable)
- Politique : Delete (suppression après expiration)

**Monitoring** :
- Lag des consommateurs (Grafana)
- Throughput (msg/s)
- Erreurs de sérialisation

---

## 💾 Modèle de données

### Diagramme entité-relation (Domain)

```
┌─────────────────────────────────────────────────────────┐
│              ConnaissanceClient (Aggregate)              │
├─────────────────────────────────────────────────────────┤
│ - id: String (UUID)                                     │
│ - nom: String (2-50 chars)                              │
│ - prenom: String (2-50 chars)                           │
│ - adresse: Adresse (Value Object) ──────────┐           │
│ - situationFamiliale: SituationFamiliale ───┤           │
│ - nombreEnfants: Integer (0-20)             │           │
└─────────────────────────────────────────────┼───────────┘
                                              │
                      ┌───────────────────────┴────────────┐
                      │                                    │
                      ▼                                    ▼
         ┌─────────────────────┐           ┌──────────────────────────┐
         │    Adresse           │           │  SituationFamiliale      │
         │  (Value Object)      │           │      (Enum)              │
         ├─────────────────────┤           ├──────────────────────────┤
         │ - ligne1: String    │           │ • CELIBATAIRE            │
         │ - ligne2: String?   │           │ • MARIE                  │
         │ - codePostal: String│           │ • DIVORCE                │
         │ - ville: String     │           │ • VEUF                   │
         └─────────────────────┘           │ • PACSE                  │
                                           └──────────────────────────┘
```

### Règles de validation

#### ConnaissanceClient

| Champ | Type | Contraintes | Exemple valide |
|-------|------|-------------|----------------|
| `id` | String (UUID) | Non nul, UUID v4 | `8a9204f5-aa42-47bc-9f04-17caab5deeee` |
| `nom` | String | 2-50 chars, lettres/espaces/tirets | `Dupont-Martin` |
| `prenom` | String | 2-50 chars, lettres/espaces/tirets | `Jean-Pierre` |
| `adresse` | Adresse | Non nul, adresse valide | Voir ci-dessous |
| `situationFamiliale` | Enum | Valeur parmi enum | `MARIE` |
| `nombreEnfants` | Integer | 0-20 | `2` |

#### Adresse

| Champ | Type | Contraintes | Exemple valide |
|-------|------|-------------|----------------|
| `ligne1` | String | Obligatoire, 5-100 chars | `12 rue Victor Hugo` |
| `ligne2` | String | Optionnel, max 100 chars | `Appartement 4B` |
| `codePostal` | String | 5 chiffres | `33000` |
| `ville` | String | 2-50 chars, validation API IGN | `Bordeaux` |

#### Règles métier

1. **Validation de l'adresse** :
   - Code postal + ville validés via API IGN
   - Si API IGN indisponible : acceptation avec warning
   - Circuit breaker : fallback après 3 échecs consécutifs

2. **Situation familiale** :
   - `CELIBATAIRE` peut avoir `nombreEnfants > 0` (famille monoparentale)
   - `MARIE` peut avoir `nombreEnfants = 0` (sans enfants)
   - `PACSE` équivalent à `MARIE` pour les règles métier

3. **Événements** :
   - Événement Kafka **uniquement** si adresse modifiée (PUT)
   - Événement Kafka **jamais** si situation familiale modifiée (PATCH)

---

## 📡 Événements et messaging

### Architecture Event-Driven

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCER (Connaissance Client)             │
│  ┌────────────────────────────────────────────────────┐      │
│  │  ConnaissanceClientService                         │      │
│  │    ↓                                               │      │
│  │  AdresseEventService.publishAdresseChangedEvent()  │      │
│  │    ↓                                               │      │
│  │  KafkaTemplate.send("connaissance-client-events")  │      │
│  └─────────────────────┬──────────────────────────────┘      │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │       Kafka Broker Cluster         │
        │  Topic: connaissance-client-events │
        │  Partitions: 3                     │
        │  Replication: 2                    │
        └───┬────────────────────────────┬───┘
            │                            │
            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Consumer Group 1   │    │   Consumer Group 2   │
│   (Analytics)        │    │   (CRM Sync)         │
└──────────────────────┘    └──────────────────────┘
```

### Schéma de l'événement

**Type** : `AdresseChangedEvent`

**Structure JSON** :

```json
{
  "eventId": "123e4567-e89b-12d3-a456-426614174000",
  "eventType": "AdresseChanged",
  "version": "1.0",
  "timestamp": "2025-11-22T10:30:45.123Z",
  "correlationId": "456e7890-a12b-34c5-d678-901234567890",
  "userId": "user@sqli.com",
  "payload": {
    "clientId": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
    "nom": "Dupont",
    "prenom": "Jean",
    "oldAdresse": {
      "ligne1": "12 rue Victor Hugo",
      "ligne2": null,
      "codePostal": "33000",
      "ville": "Bordeaux"
    },
    "newAdresse": {
      "ligne1": "25 avenue des Champs-Elysees",
      "ligne2": null,
      "codePostal": "75008",
      "ville": "Paris"
    }
  }
}
```

**Champs système** :

| Champ | Type | Description |
|-------|------|-------------|
| `eventId` | UUID | Identifiant unique de l'événement |
| `eventType` | String | Type d'événement (`AdresseChanged`) |
| `version` | String | Version du schéma (`1.0`) |
| `timestamp` | ISO 8601 | Date/heure de publication |
| `correlationId` | UUID | ID de corrélation (tracing) |
| `userId` | String | Utilisateur à l'origine de la modification |

### Garanties de livraison

**Configuration producer** :

```yaml
spring:
  kafka:
    producer:
      acks: all                    # Tous les brokers doivent confirmer
      retries: 3                   # 3 tentatives si échec
      properties:
        enable.idempotence: true   # Évite les doublons
        max.in.flight.requests.per.connection: 1  # Ordre garanti
```

**Garanties** :
- ✅ **At-least-once** : L'événement est livré au moins une fois
- ✅ **Ordre garanti** : Par clé de partition (clientId)
- ❌ **Exactly-once** : Non garanti (idempotence côté consumer requis)

### Évolution du schéma

**Stratégie** : Versionning avec rétrocompatibilité

**Règles** :
1. ✅ Ajout de champs optionnels : OK
2. ✅ Changement de nom de champ : Ajouter alias
3. ❌ Suppression de champ obligatoire : Breaking change → version 2.0

**Exemple** :

```java
// Version 1.0
public class AdresseChangedEvent {
  private String eventId;
  private String clientId;
  private Adresse oldAdresse;
  private Adresse newAdresse;
}

// Version 1.1 : Ajout champ optionnel (OK)
public class AdresseChangedEvent {
  private String eventId;
  private String clientId;
  private Adresse oldAdresse;
  private Adresse newAdresse;
  private String reason;  // Nouveau champ optionnel
}
```

---

## 🔒 Sécurité

### Authentification JWT

**Flux** :

```
┌─────────┐     ┌──────────┐     ┌───────────────┐     ┌──────────┐
│ Client  │────►│ Keycloak │────►│ JWT Token     │────►│   API    │
│  (UI)   │     │ (OAuth2) │     │ (Authorization)│     │  REST    │
└─────────┘     └──────────┘     └───────────────┘     └──────────┘
    1. Login          2. Token           3. Request
   user/pass         generation         with Bearer
```

**Header HTTP** :

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Claims JWT** :

```json
{
  "sub": "user@sqli.com",
  "name": "Jean Dupont",
  "roles": ["CLIENT_ADMIN", "CLIENT_VIEWER"],
  "iss": "https://keycloak.sqli.com",
  "exp": 1700654400,
  "iat": 1700650800
}
```

**Configuration Spring Security** :

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.sqli.com/realms/sqli
          jwk-set-uri: https://keycloak.sqli.com/realms/sqli/protocol/openid-connect/certs
```

### Autorisation (RBAC)

**Rôles** :

| Rôle | Permissions |
|------|-------------|
| `CLIENT_ADMIN` | CRUD complet (create, read, update, delete) |
| `CLIENT_EDITOR` | Lecture + modification (read, update) |
| `CLIENT_VIEWER` | Lecture seule (read) |

**Annotations** :

```java
@RestController
@PreAuthorize("hasRole('CLIENT_VIEWER')")
public class ConnaissanceClientApiController {
  
  @GetMapping("/{id}")
  public ResponseEntity<ConnaissanceClientDto> getClient(@PathVariable String id) {
    // Accessible à tous (VIEWER, EDITOR, ADMIN)
  }
  
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('CLIENT_EDITOR')")
  public ResponseEntity<ConnaissanceClientDto> modifierClient(...) {
    // Accessible à EDITOR et ADMIN uniquement
  }
  
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('CLIENT_ADMIN')")
  public ResponseEntity<Void> deleteClient(@PathVariable String id) {
    // Accessible à ADMIN uniquement
  }
}
```

### Protection des données (RGPD)

**Données personnelles** :
- `nom`, `prenom`, `adresse` : Données identifiantes
- `situationFamiliale`, `nombreEnfants` : Données sensibles

**Mesures de protection** :

1. **Chiffrement en transit** :
   - ✅ HTTPS uniquement (TLS 1.3)
   - ✅ Kafka : SSL/TLS entre brokers

2. **Chiffrement au repos** :
   - ✅ MongoDB : Encryption at rest activé
   - ✅ Backups chiffrés (AES-256)

3. **Audit trail** :
   - ✅ Logs MDC : `userId`, `clientId`, `operation`, `timestamp`
   - ✅ Rétention logs : 90 jours (conformité)

4. **Droit à l'oubli** :
   - ✅ Endpoint `DELETE /v1/connaissance-clients/{id}`
   - ✅ Soft delete avec purge après 30 jours

---

## 🛡️ Résilience et tolérance aux pannes

### Stratégies de résilience

#### 1. Circuit Breaker (API IGN)

**Pattern** : Resilience4j Circuit Breaker

**Configuration** :

```yaml
resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        slidingWindowSize: 10              # Fenêtre de 10 appels
        failureRateThreshold: 30           # Ouvre si 30% d'échecs
        slowCallRateThreshold: 50          # Ouvre si 50% lents
        slowCallDurationThreshold: 3s      # Seuil "lent"
        waitDurationInOpenState: 60s       # Reste ouvert 60s
        permittedNumberOfCallsInHalfOpenState: 5
        automaticTransitionFromOpenToHalfOpenEnabled: true
```

**États** :

```
CLOSED (normal) ──┐
                  │ 30% échecs
                  ▼
              OPEN (skip) ──┐
                            │ Après 60s
                            ▼
                      HALF_OPEN (test)
                            │
                ┌───────────┼───────────┐
                │           │           │
              CLOSED      OPEN      HALF_OPEN
            (récupéré) (encore KO) (continue test)
```

**Fallback** :

```java
@CircuitBreaker(name = "apiIgn", fallbackMethod = "fallback")
public void validerAdresse(String codePostal, String ville) {
  // Appel API IGN
}

private void fallback(String codePostal, String ville, Exception ex) {
  log.warn("Circuit breaker OPEN - accepting address without validation: {} {}", 
      codePostal, ville);
  // Accepte sans validation
}
```

#### 2. Retry (Kafka producer)

**Configuration** :

```yaml
spring:
  kafka:
    producer:
      retries: 3                          # 3 tentatives
      properties:
        retry.backoff.ms: 1000            # 1s entre tentatives
```

**Stratégie** :
- Tentative 1 : Immédiate
- Tentative 2 : Après 1s
- Tentative 3 : Après 2s (backoff exponentiel)

#### 3. Timeouts

| Service | Timeout | Configuration |
|---------|---------|---------------|
| **API IGN** | 3s | `http.client.connect-timeout=3000` |
| **MongoDB** | 5s | `spring.data.mongodb.timeout=5000` |
| **Kafka producer** | 30s | `spring.kafka.producer.properties.request.timeout.ms=30000` |

#### 4. Bulkhead (Isolation)

**Pattern** : Thread Pool isolation

```yaml
resilience4j:
  bulkhead:
    instances:
      apiIgn:
        maxConcurrentCalls: 10            # Max 10 appels concurrents
        maxWaitDuration: 0                # Pas d'attente (fail fast)
```

**Bénéfice** : Évite qu'un service lent (API IGN) bloque tous les threads.

### Scénarios de panne

#### Scénario 1 : MongoDB indisponible

**Impact** : Application complètement down (pas de fallback)

**Mitigation** :
- ✅ MongoDB Replica Set 3 nodes (HA)
- ✅ Health check : `/actuator/health` retourne `DOWN`
- ✅ Kubernetes : Restart automatique du pod

#### Scénario 2 : API IGN indisponible

**Impact** : Modifications d'adresse acceptées sans validation

**Mitigation** :
- ✅ Circuit breaker : Fallback après 3 échecs
- ⚠️ Logs : Warning pour monitoring
- 📊 Métriques : `circuit_breaker_open_count`
- 🔔 Alertes : Email si circuit ouvert > 2min

#### Scénario 3 : Kafka indisponible

**Impact** : Événements perdus (pas de retry infini)

**Mitigation** :
- ✅ Kafka producer retry : 3 tentatives
- ❌ Après 3 échecs : Événement perdu (log ERROR)
- 🔔 Alertes : Email si taux d'erreur > 5%

**Amélioration future** :
- Dead Letter Queue (DLQ) pour événements échoués
- Replay manuel depuis MongoDB Change Streams

---

## 📊 Observabilité

### Logs (SLF4J + Logback)

**Format structuré** :

```
2025-11-22 10:30:45.123 [http-nio-8080-exec-1] INFO c.s.w.d.c.c.d.ConnaissanceClientServiceImpl 
[userId=user@sqli.com] [correlationId=123e4567-e89b-12d3-a456-426614174000] 
[clientId=8a9204f5-aa42-47bc-9f04-17caab5deeee] [operation=modifierClient] 
- Client 8a9204f5-aa42-47bc-9f04-17caab5deeee updated. Address changed: true
```

**MDC (Mapped Diagnostic Context)** :

```java
MDC.put("userId", securityContext.getUserId());
MDC.put("correlationId", request.getHeader("X-Correlation-ID"));
MDC.put("clientId", clientId);
MDC.put("operation", "modifierClient");
```

**Niveaux de log** :

| Niveau | Utilisation |
|--------|-------------|
| `ERROR` | Erreurs bloquantes (exception non gérée) |
| `WARN` | Situations anormales (circuit breaker open, fallback) |
| `INFO` | Événements métier (client créé, modifié, supprimé) |
| `DEBUG` | Détails techniques (appel API, requête MongoDB) |
| `TRACE` | Debug très détaillé (contenu JSON) |

### Métriques (Prometheus)

**Endpoints Actuator** :

```
GET /actuator/prometheus
GET /actuator/metrics
GET /actuator/health
```

**Métriques clés** :

| Métrique | Type | Description |
|----------|------|-------------|
| `http_server_requests_seconds` | Histogram | Latence HTTP (p50, p95, p99) |
| `resilience4j_circuitbreaker_state` | Gauge | État circuit breaker (0=CLOSED, 1=OPEN) |
| `resilience4j_circuitbreaker_failure_rate` | Gauge | Taux d'échec API IGN |
| `kafka_producer_record_send_total` | Counter | Nombre d'événements Kafka |
| `jvm_memory_used_bytes` | Gauge | Mémoire JVM utilisée |
| `jvm_threads_live` | Gauge | Nombre de threads actifs |

**Exemple de requête PromQL** :

```promql
# Latence p95 de l'endpoint PUT modifier-client
histogram_quantile(0.95, 
  sum(rate(http_server_requests_seconds_bucket{
    uri="/v1/connaissance-clients/{id}",
    method="PUT"
  }[5m])) by (le)
)

# Taux d'erreur 5xx
sum(rate(http_server_requests_seconds_count{
  status=~"5.."
}[5m])) 
/ 
sum(rate(http_server_requests_seconds_count[5m]))
```

### Tracing distribué (OpenTelemetry)

**Configuration** :

```yaml
spring:
  application:
    name: connaissance-client
  sleuth:
    sampler:
      probability: 1.0  # 100% en dev, 10% en prod
```

**Trace ID propagation** :

```
Client HTTP
   ├─ Trace ID: 123e4567-e89b-12d3-a456-426614174000
   │
   ▼
Controller (Span 1: http.request)
   │
   ▼
Service (Span 2: business.logic)
   │
   ├─► API IGN (Span 3: http.client)
   │
   ├─► MongoDB (Span 4: database.query)
   │
   └─► Kafka (Span 5: messaging.send)
```

**Visualisation** : Jaeger UI

### Dashboard Grafana

**Fichier** : `docs/monitoring/grafana-modifier-client.json`

**Panneaux** :

1. **Vue d'ensemble** :
   - Throughput (req/s)
   - Latence p50/p95/p99
   - Taux d'erreur 4xx/5xx

2. **Circuit Breaker** :
   - État (CLOSED/OPEN/HALF_OPEN)
   - Taux d'échec
   - Nombre d'appels

3. **Événements Kafka** :
   - Nombre d'événements publiés
   - Erreurs de sérialisation

4. **JVM** :
   - Heap memory usage
   - GC count/duration
   - Thread count

---

## 📖 Décisions d'architecture

### ADR (Architecture Decision Records)

#### ADR-001 : Architecture Hexagonale

**Date** : 2025-01-15  
**Statut** : Accepté

**Contexte** :
- Besoin d'isoler la logique métier des frameworks
- Faciliter les tests unitaires sans infrastructure
- Permettre le changement de MongoDB vers PostgreSQL si besoin

**Décision** :
- Adopter l'architecture hexagonale (Ports & Adapters)
- Domaine métier au centre, sans dépendances externes
- Ports = interfaces définies dans le domaine
- Adapters = implémentations dans l'infrastructure

**Conséquences** :
- ✅ Testabilité maximale (domain 100% testable)
- ✅ Indépendance vis-à-vis des frameworks
- ⚠️ Complexité accrue (plus de modules, mapping)

#### ADR-002 : MongoDB comme base de données

**Date** : 2025-01-20  
**Statut** : Accepté

**Contexte** :
- Modèle de données simple (agrégat `ConnaissanceClient`)
- Pas de relations complexes
- Besoin de scalabilité horizontale

**Décision** :
- Utiliser MongoDB (NoSQL document store)
- Adresse embedded (pas de collection séparée)
- Sharding par `_id` (UUID)

**Conséquences** :
- ✅ Performance lecture/écriture excellente
- ✅ Scalabilité horizontale (sharding)
- ⚠️ Pas de transactions ACID multi-documents (non requis ici)

#### ADR-003 : Kafka pour les événements

**Date** : 2025-02-01  
**Statut** : Accepté

**Contexte** :
- Besoin de notifier d'autres systèmes (CRM, Analytics)
- Communication asynchrone requise
- Découplage producteur/consommateurs

**Décision** :
- Utiliser Apache Kafka
- Topic `connaissance-client-events`
- Partition par `clientId` (ordre garanti)

**Conséquences** :
- ✅ Découplage fort (producteur ne connaît pas les consommateurs)
- ✅ Scalabilité (ajout de consommateurs sans impact)
- ⚠️ Complexité opérationnelle (cluster Kafka à maintenir)

#### ADR-004 : Circuit Breaker pour API IGN

**Date** : 2025-02-10  
**Statut** : Accepté

**Contexte** :
- API IGN externe sans SLA garanti
- Risque de latence ou indisponibilité
- Ne doit pas bloquer les modifications critiques

**Décision** :
- Implémenter Circuit Breaker (Resilience4j)
- Fallback : accepter l'adresse sans validation
- Ouvre après 30% d'échecs sur 10 appels

**Conséquences** :
- ✅ Résilience face aux pannes API IGN
- ✅ Expérience utilisateur non dégradée
- ⚠️ Risque d'adresses invalides acceptées (acceptable)

#### ADR-005 : Événements uniquement pour changement d'adresse

**Date** : 2025-02-15  
**Statut** : Accepté

**Contexte** :
- Changement d'adresse : impact fort (logistique, facturation)
- Changement de situation familiale : impact faible (analytique)

**Décision** :
- Publier événement Kafka **uniquement** si adresse changée
- Pas d'événement pour situation familiale

**Conséquences** :
- ✅ Réduit le volume d'événements Kafka
- ✅ Focus sur les changements critiques
- ⚠️ Si besoin futur : ajouter `SituationFamilialeChangedEvent`

---

## 📞 Support et contacts

**Équipe** : SQLI - Data Lake Team  
**Architecte** : Pierre Bousquet (pbousquet@sqli.com)  
**Documentation** : [Wiki interne](http://wiki.sqli.com/connaissance-client)  
**Issues** : [GitHub Issues](https://github.com/sqli/connaissance-client/issues)

---

## 📚 Références

- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design - Eric Evans](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Event-Driven Architecture - Martin Fowler](https://martinfowler.com/articles/201701-event-driven.html)
- [Circuit Breaker Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Resilience4j Documentation](https://resilience4j.readme.io/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)

---

**Version** : 2.0.0  
**Dernière mise à jour** : 22 novembre 2025  
**Auteur** : SQLI Data Lake Team
