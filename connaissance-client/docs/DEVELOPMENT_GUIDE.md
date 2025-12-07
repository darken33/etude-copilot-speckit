# Guide de Développement - Connaissance Client

> Documentation complète pour les développeurs contribuant au projet

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Coverage](https://img.shields.io/badge/Coverage-87.4%25-brightgreen.svg)](https://www.jacoco.org/)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Configuration de l'environnement](#-configuration-de-lenvironnement)
- [Architecture et Design Patterns](#-architecture-et-design-patterns)
- [Conventions de code](#-conventions-de-code)
- [Stratégie de test](#-stratégie-de-test)
- [Gestion des dépendances](#-gestion-des-dépendances)
- [Build et Release](#-build-et-release)
- [Debugging et Troubleshooting](#-debugging-et-troubleshooting)
- [Performance et Optimisation](#-performance-et-optimisation)
- [Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

Ce guide s'adresse aux développeurs qui souhaitent contribuer au projet **Connaissance Client**. Il couvre :

- ✅ Configuration de l'environnement de développement
- ✅ Conventions de code et bonnes pratiques
- ✅ Architecture hexagonale et patterns DDD
- ✅ Stratégie de test (unitaires, intégration, BDD)
- ✅ Workflow Git et revue de code
- ✅ Build, release et déploiement

### Prérequis pour développeurs

| Outil | Version minimale | Recommandé |
|-------|------------------|------------|
| **Java JDK** | 21 | OpenJDK 21.0.1 |
| **Maven** | 3.9.0 | 3.9.6 |
| **Docker** | 24.0 | Docker Desktop |
| **IDE** | - | IntelliJ IDEA 2024+ |
| **Git** | 2.40+ | 2.43+ |

### Architecture du projet

```
connaissance-client/
├── connaissance-client-api/          # Couche API (REST Controllers, DTOs)
├── connaissance-client-app/          # Application Spring Boot (Configuration)
├── connaissance-client-domain/       # Domaine métier (Services, Entities, Ports)
├── connaissance-client-db-adapter/   # Adaptateur MongoDB
├── connaissance-client-cp-adapter/   # Adaptateur API IGN
├── connaissance-client-event-adapter/ # Adaptateur Kafka
├── tests/                            # Tests BDD Karate, JMeter, ZAP
├── docs/                             # Documentation
├── k8s/                              # Manifestes Kubernetes
└── architecture/                     # Diagrammes d'architecture
```

---

## ⚙️ Configuration de l'environnement

### 1. Installation des outils

#### Java 21 (OpenJDK)

```bash
# macOS (Homebrew)
brew install openjdk@21

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install openjdk-21-jdk

# Vérification
java -version  # java version "21.0.1"
```

#### Maven 3.9+

```bash
# macOS
brew install maven

# Linux
sudo apt install maven

# Vérification
mvn -version  # Apache Maven 3.9.6
```

#### Docker Desktop

Télécharger depuis [docker.com](https://www.docker.com/products/docker-desktop/)

```bash
docker --version  # Docker version 24.x
docker-compose --version  # Docker Compose version v2.x
```

### 2. Configuration IDE (IntelliJ IDEA)

#### Import du projet

1. **File** → **Open** → Sélectionner `pom.xml` racine
2. **Import as Maven project** → **OK**
3. **Project SDK** → Java 21
4. **Maven** → Reload all Maven projects

#### Plugins recommandés

| Plugin | Utilité |
|--------|---------|
| **Lombok** | Support annotations @Data, @Builder, etc. |
| **SonarLint** | Analyse qualité de code en temps réel |
| **CheckStyle-IDEA** | Validation style de code |
| **Spring Boot Assistant** | Autocomplétion propriétés Spring |
| **Docker** | Gestion containers depuis l'IDE |

#### Configuration Code Style

1. **Settings** → **Editor** → **Code Style** → **Java**
2. **Scheme** → **Import Scheme** → [Google Java Style](https://google.github.io/styleguide/javaguide.html)
3. Fichier disponible : `docs/intellij-java-google-style.xml`

#### Configuration Lombok

1. **Settings** → **Build, Execution, Deployment** → **Compiler** → **Annotation Processors**
2. ✅ **Enable annotation processing**

### 3. Démarrage des services locaux

#### Option A : Docker Compose (recommandé)

```bash
cd tests/local_kafka
docker-compose up -d
```

**Services démarrés** :
- MongoDB : `localhost:27017`
- Kafka : `localhost:9092`
- Zookeeper : `localhost:2181`

#### Option B : Services individuels

**MongoDB** :
```bash
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=mongoadmin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7.0
```

**Kafka** :
```bash
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  confluentinc/cp-kafka:7.5.0
```

### 4. Configuration de l'application

#### Variables d'environnement (développement)

Créer `.env` à la racine :

```properties
# MongoDB
MONGODB_URI=mongodb://mongoadmin:secret@localhost:27017
MONGODB_DATABASE=connaissancedb

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# API IGN
API_IGN_BASE_URL=https://apicarto.ign.fr

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_SQLI=DEBUG

# Circuit Breaker (dev)
RESILIENCE4J_CIRCUIT_BREAKER_INSTANCES_APIIGN_FAILURE_RATE_THRESHOLD=50
```

#### Profil Spring Boot

Créer `connaissance-client-app/src/main/resources/application-dev.yml` :

```yaml
spring:
  profiles:
    active: dev
  
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017}
      database: ${MONGODB_DATABASE:connaissancedb}
  
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

logging:
  level:
    root: DEBUG
    com.sqli: TRACE
    org.springframework.data.mongodb: DEBUG

resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        failureRateThreshold: 50  # Plus permissif en dev
        slowCallRateThreshold: 50
        waitDurationInOpenState: 30s  # Retry plus rapide
```

### 5. Lancement de l'application

#### Depuis l'IDE

1. Run configuration **ConnaissanceClientApplication**
2. VM options : `-Dspring.profiles.active=dev`
3. Run 🚀

#### Depuis Maven

```bash
cd connaissance-client-app
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Vérification

```bash
# Health check
curl http://localhost:8080/actuator/health

# Liste des clients (devrait être vide)
curl http://localhost:8080/v1/connaissance-clients
```

---

## 🏗️ Architecture et Design Patterns

### Architecture Hexagonale (Ports & Adapters)

Le projet suit l'**architecture hexagonale** (Alistair Cockburn) avec **Domain-Driven Design** (Eric Evans).

#### Principes fondamentaux

1. **Le domaine au centre** : Logique métier indépendante des frameworks
2. **Inversion de dépendances** : Le domaine définit des ports (interfaces), les adapters les implémentent
3. **Isolation des couches** : API ↔ Domain ↔ Infrastructure
4. **Testabilité** : Le domaine peut être testé sans infrastructure

#### Modules et responsabilités

```
┌─────────────────────────────────────────────────────────────┐
│                     HEXAGONAL ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌───────────────────────────────────────────────────┐     │
│   │          PRIMARY ADAPTERS (Driving)               │     │
│   │   ┌─────────────────────────────────────────┐     │     │
│   │   │  connaissance-client-api                │     │     │
│   │   │  - Controllers (REST endpoints)         │     │     │
│   │   │  - DTOs (Request/Response)              │     │     │
│   │   │  - Delegates (API → Domain mapping)     │     │     │
│   │   └─────────────────┬───────────────────────┘     │     │
│   └─────────────────────┼───────────────────────────────┘     │
│                         │                                     │
│   ┌─────────────────────▼───────────────────────────────┐     │
│   │              DOMAIN (Core)                          │     │
│   │   ┌─────────────────────────────────────────┐       │     │
│   │   │  connaissance-client-domain             │       │     │
│   │   │  - Entities (ConnaissanceClient)        │       │     │
│   │   │  - Services (Business logic)            │       │     │
│   │   │  - Ports (Interfaces)                   │       │     │
│   │   │    * ConnaissanceClientRepository       │       │     │
│   │   │    * CodePostauxService                 │       │     │
│   │   │    * AdresseEventService                │       │     │
│   │   └─────────────────┬───────────────────────┘       │     │
│   └─────────────────────┼───────────────────────────────┘     │
│                         │                                     │
│   ┌─────────────────────▼───────────────────────────────┐     │
│   │      SECONDARY ADAPTERS (Driven)                    │     │
│   │   ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │     │
│   │   │ db-adapter   │  │ cp-adapter   │  │ event-  │  │     │
│   │   │ (MongoDB)    │  │ (API IGN)    │  │ adapter │  │     │
│   │   │              │  │              │  │ (Kafka) │  │     │
│   │   └──────────────┘  └──────────────┘  └─────────┘  │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Module : connaissance-client-domain (Core)

**Responsabilités** :
- Définir les **entités métier** (ConnaissanceClient, Adresse, SituationFamiliale)
- Implémenter la **logique métier** (règles de validation, calculs)
- Déclarer les **ports** (interfaces) pour l'infrastructure

**Règles** :
- ❌ **AUCUNE dépendance** vers Spring, MongoDB, Kafka, etc.
- ✅ Utilise uniquement Java standard + annotations Lombok
- ✅ 100% testable sans framework

**Exemple : Entity** (`ConnaissanceClient.java`)

```java
@Data
@Builder
public class ConnaissanceClient {
    private String id;
    private String nom;
    private String prenom;
    private Adresse adresse;
    private SituationFamiliale situationFamiliale;
    private Integer nombreEnfants;
    
    /**
     * Vérifie si l'adresse a changé par rapport à une autre instance.
     */
    public boolean hasAdresseChanged(ConnaissanceClient other) {
        return !Objects.equals(this.adresse, other.adresse);
    }
}
```

**Exemple : Port** (`ConnaissanceClientRepository.java`)

```java
public interface ConnaissanceClientRepository {
    ConnaissanceClient save(ConnaissanceClient client);
    Optional<ConnaissanceClient> findById(String id);
    List<ConnaissanceClient> findAll();
    void deleteById(String id);
}
```

**Exemple : Service métier** (`ConnaissanceClientServiceImpl.java`)

```java
@Slf4j
@RequiredArgsConstructor
public class ConnaissanceClientServiceImpl implements ConnaissanceClientService {
    private final ConnaissanceClientRepository repository;
    private final CodePostauxService codePostauxService;
    private final AdresseEventService adresseEventService;
    
    @Override
    public ConnaissanceClient modifierClient(String id, ConnaissanceClient newData) {
        ConnaissanceClient existing = repository.findById(id)
            .orElseThrow(() -> new ClientNotFoundException(id));
        
        // Validation adresse via API IGN
        codePostauxService.validerAdresse(
            newData.getAdresse().getCodePostal(),
            newData.getAdresse().getVille()
        );
        
        // Mise à jour
        ConnaissanceClient updated = repository.save(newData);
        
        // Événement Kafka si adresse changée
        if (updated.hasAdresseChanged(existing)) {
            adresseEventService.publishAdresseChangedEvent(updated);
        }
        
        return updated;
    }
}
```

#### Module : connaissance-client-api (Primary Adapter)

**Responsabilités** :
- Exposer les **endpoints REST**
- Mapper **DTO ↔ Entité**
- Gérer la **validation HTTP** (Bean Validation)
- Gérer les **erreurs HTTP** (4xx, 5xx)

**Pattern : Delegate**

Le pattern **Delegate** sépare le contrôleur REST de la logique de mapping.

```java
// Controller (léger, uniquement routing HTTP)
@RestController
@RequiredArgsConstructor
public class ConnaissanceClientApiController implements ConnaissanceClientApi {
    private final ConnaissanceClientDelegate delegate;
    
    @Override
    public ResponseEntity<ConnaissanceClientDto> modifierClient(
        String id,
        ModifierClientRequestDto request
    ) {
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
        ConnaissanceClient domainRequest = mapper.toDomain(dto);
        ConnaissanceClient updated = service.modifierClient(id, domainRequest);
        return mapper.toDto(updated);
    }
}
```

**Gestion des erreurs** (`GlobalExceptionHandler.java`)

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ClientNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleClientNotFound(ClientNotFoundException ex) {
        log.error("Client not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("CLIENT_NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(AdresseInvalideException.class)
    public ResponseEntity<ErrorResponse> handleAdresseInvalide(AdresseInvalideException ex) {
        log.error("Invalid address: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse("INVALID_ADDRESS", ex.getMessage()));
    }
}
```

#### Module : connaissance-client-db-adapter (Secondary Adapter)

**Responsabilités** :
- Implémenter **ConnaissanceClientRepository** (port)
- Gérer la **persistence MongoDB**
- Mapper **Entité ↔ Document MongoDB**

**Pattern : Repository**

```java
// Adapter (implémente le port du domain)
@Repository
@RequiredArgsConstructor
public class ConnaissanceClientRepositoryAdapter implements ConnaissanceClientRepository {
    private final MongoConnaissanceClientRepository mongoRepository;
    private final ConnaissanceClientMongoMapper mapper;
    
    @Override
    public ConnaissanceClient save(ConnaissanceClient client) {
        ConnaissanceClientDocument document = mapper.toDocument(client);
        ConnaissanceClientDocument saved = mongoRepository.save(document);
        return mapper.toDomain(saved);
    }
    
    @Override
    public Optional<ConnaissanceClient> findById(String id) {
        return mongoRepository.findById(id)
            .map(mapper::toDomain);
    }
}

// Repository Spring Data MongoDB
public interface MongoConnaissanceClientRepository 
    extends MongoRepository<ConnaissanceClientDocument, String> {
}
```

#### Module : connaissance-client-cp-adapter (Secondary Adapter)

**Responsabilités** :
- Implémenter **CodePostauxService** (port)
- Appeler **API IGN** via RestTemplate
- Gérer **résilience** (Circuit Breaker)

**Pattern : Circuit Breaker**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiIgnCodePostauxServiceAdapter implements CodePostauxService {
    private final RestTemplate restTemplate;
    
    @Override
    @CircuitBreaker(
        name = "apiIgn",
        fallbackMethod = "validerAdresseFallback"
    )
    public void validerAdresse(String codePostal, String ville) {
        String url = "https://apicarto.ign.fr/api/codes-postaux/communes/" + codePostal;
        CommuneResponse[] communes = restTemplate.getForObject(url, CommuneResponse[].class);
        
        boolean valid = Arrays.stream(communes)
            .anyMatch(c -> c.getNomCommune().equalsIgnoreCase(ville));
        
        if (!valid) {
            throw new AdresseInvalideException(
                "Code postal " + codePostal + " incompatible avec ville " + ville
            );
        }
    }
    
    // Fallback : accepte l'adresse sans validation externe
    private void validerAdresseFallback(String codePostal, String ville, Exception ex) {
        log.warn("Circuit breaker open - skipping IGN validation for {} {}", codePostal, ville);
    }
}
```

### Design Patterns utilisés

| Pattern | Utilisation | Module |
|---------|-------------|--------|
| **Hexagonal Architecture** | Séparation domaine/infrastructure | Tous |
| **Repository** | Abstraction persistence | domain, db-adapter |
| **Delegate** | Séparation controller/mapping | api |
| **Circuit Breaker** | Résilience appels externes | cp-adapter |
| **Builder** | Construction objets complexes | domain (Lombok) |
| **Strategy** | Validation multiple (Bean Validation) | api |
| **Observer** | Événements Kafka | domain, event-adapter |
| **Factory** | Création DTOs | api (mappers) |

---

## 📝 Conventions de code

### Style de code

Le projet suit le [**Google Java Style Guide**](https://google.github.io/styleguide/javaguide.html).

#### Règles principales

**1. Indentation** : 2 espaces (pas de tabs)

```java
public class Example {
  public void method() {
    if (condition) {
      doSomething();
    }
  }
}
```

**2. Longueur de ligne** : Maximum 100 caractères

**3. Imports** : Pas de wildcard (`*`)

```java
// ✅ BON
import java.util.List;
import java.util.Optional;

// ❌ MAUVAIS
import java.util.*;
```

**4. Nommage** :

| Type | Convention | Exemple |
|------|------------|---------|
| Classe | PascalCase | `ConnaissanceClient` |
| Méthode | camelCase | `modifierClient()` |
| Variable | camelCase | `clientId` |
| Constante | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Package | lowercase | `com.sqli.west.datalake` |

**5. Annotations Lombok** :

```java
// ✅ BON : Ordre standard
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnaissanceClient {
  private String id;
  private String nom;
}

// ❌ MAUVAIS : Pas de @ToString sur entités avec relations (risque StackOverflow)
@Data
@ToString  // ❌ Dangereux
public class Client {
  private List<Commande> commandes;  // Boucle infinie si Commande a @ToString(client)
}
```

### Bonnes pratiques Java 21

#### 1. Records (Java 14+)

Pour les DTOs **immutables** :

```java
// ✅ BON : DTO immutable
public record ModifierClientRequestDto(
    String nom,
    String prenom,
    AdresseDto adresse,
    SituationFamiliale situationFamiliale,
    Integer nombreEnfants
) {}

// ❌ MAUVAIS : @Data sur DTO (mutable)
@Data
public class ModifierClientRequestDto {
  private String nom;  // Mutable
  private String prenom;
}
```

#### 2. Pattern Matching (Java 21)

```java
// ✅ BON : Pattern matching
public String formatError(Exception ex) {
  return switch (ex) {
    case ClientNotFoundException e -> "Client " + e.getClientId() + " introuvable";
    case AdresseInvalideException e -> "Adresse invalide : " + e.getMessage();
    case null, default -> "Erreur inconnue";
  };
}
```

#### 3. Text Blocks (Java 15+)

```java
// ✅ BON : Text block pour JSON/SQL
String json = """
    {
      "nom": "Dupont",
      "prenom": "Jean"
    }
    """;
```

#### 4. Optional

```java
// ✅ BON : Gestion élégante avec Optional
return repository.findById(id)
    .map(mapper::toDto)
    .orElseThrow(() -> new ClientNotFoundException(id));

// ❌ MAUVAIS : Optional.get() sans vérification
ConnaissanceClient client = repository.findById(id).get();  // ❌ Risque NoSuchElementException
```

### Commentaires et Javadoc

#### Javadoc obligatoire

- ✅ Classes publiques
- ✅ Méthodes publiques/protected
- ✅ Interfaces (ports)

**Template** :

```java
/**
 * Service métier pour la gestion des fiches de connaissance client.
 * <p>
 * Responsabilités :
 * <ul>
 *   <li>Validation des données via API IGN</li>
 *   <li>Publication d'événements Kafka si adresse modifiée</li>
 *   <li>Gestion de la persistence via MongoDB</li>
 * </ul>
 *
 * @author SQLI
 * @version 2.0.0
 * @since 1.0.0
 */
public interface ConnaissanceClientService {
  
  /**
   * Modifie une fiche client existante.
   * <p>
   * Valide l'adresse via l'API IGN (avec circuit breaker).
   * Publie un événement Kafka si l'adresse a changé.
   *
   * @param id identifiant unique du client
   * @param newData nouvelles données du client
   * @return le client modifié
   * @throws ClientNotFoundException si le client n'existe pas
   * @throws AdresseInvalideException si l'adresse est invalide (API IGN)
   */
  ConnaissanceClient modifierClient(String id, ConnaissanceClient newData);
}
```

#### Commentaires inline

```java
// ✅ BON : Explique le "pourquoi", pas le "quoi"
// Fallback si API IGN indisponible : on accepte l'adresse sans validation externe
// pour éviter de bloquer les modifications critiques
if (circuitBreakerOpen) {
  log.warn("Circuit breaker open - skipping IGN validation");
  return;
}

// ❌ MAUVAIS : Répète le code
// Vérifie si i est inférieur à 10
if (i < 10) {
  // ...
}
```

### Logging

#### Niveaux de log

| Niveau | Usage |
|--------|-------|
| `ERROR` | Erreurs bloquantes (exception non gérée, corruption données) |
| `WARN` | Situations anormales mais non bloquantes (circuit breaker open, fallback) |
| `INFO` | Événements métier importants (client créé, adresse modifiée) |
| `DEBUG` | Détails techniques (appel API, requête MongoDB) |
| `TRACE` | Debug très détaillé (contenu requêtes, variables) |

#### Bonnes pratiques

```java
// ✅ BON : Logging structuré avec MDC
log.info("Client {} updated successfully. Address changed: {}", 
    clientId, hasAdresseChanged);

// ✅ BON : Log exception avec stack trace
log.error("Failed to call IGN API for postal code {}", codePostal, ex);

// ❌ MAUVAIS : Concaténation de strings
log.info("Client " + clientId + " updated");  // ❌ Performance

// ❌ MAUVAIS : Log sans contexte
log.error("Error occurred");  // ❌ Inutile
```

#### MDC (Mapped Diagnostic Context)

Toujours inclure :

```java
MDC.put("userId", securityContext.getUserId());
MDC.put("correlationId", request.getHeader("X-Correlation-ID"));
MDC.put("clientId", clientId);
MDC.put("operation", "modifierClient");

try {
  // Business logic
} finally {
  MDC.clear();
}
```

### Gestion des exceptions

#### Hiérarchie des exceptions

```
RuntimeException
├── BusinessException (abstract)
│   ├── ClientNotFoundException
│   ├── AdresseInvalideException
│   └── SituationFamilialeInvalideException
└── TechnicalException (abstract)
    ├── ApiIgnUnavailableException
    └── DatabaseException
```

#### Création d'une exception métier

```java
public class ClientNotFoundException extends BusinessException {
  private final String clientId;
  
  public ClientNotFoundException(String clientId) {
    super("Client with ID " + clientId + " not found");
    this.clientId = clientId;
  }
  
  public String getClientId() {
    return clientId;
  }
}
```

---

## 🧪 Stratégie de test

### Pyramide de tests

```
                  ▲
                 / \
                /   \
               /  E2E \ ← 5% (Karate BDD)
              /_______\
             /         \
            / Intégration\ ← 25% (Testcontainers)
           /_____________\
          /               \
         /    Unitaires     \ ← 70% (JUnit 5 + Mockito)
        /___________________\
```

**Objectif de couverture** : **80% minimum**

### Tests unitaires (70%)

**Cible** : Logique métier pure (domain)

**Frameworks** :
- JUnit 5
- Mockito
- AssertJ

**Exemple** : Test du service métier

```java
@ExtendWith(MockitoExtension.class)
class ConnaissanceClientServiceImplTest {
  
  @Mock
  private ConnaissanceClientRepository repository;
  
  @Mock
  private CodePostauxService codePostauxService;
  
  @Mock
  private AdresseEventService adresseEventService;
  
  @InjectMocks
  private ConnaissanceClientServiceImpl service;
  
  @Test
  @DisplayName("Devrait modifier le client et publier un événement Kafka si adresse changée")
  void shouldModifyClientAndPublishEventWhenAddressChanged() {
    // Given
    String clientId = "123e4567-e89b-12d3-a456-426614174000";
    ConnaissanceClient existing = ConnaissanceClient.builder()
        .id(clientId)
        .nom("Dupont")
        .adresse(new Adresse("12 rue Victor Hugo", null, "33000", "Bordeaux"))
        .build();
    
    ConnaissanceClient newData = ConnaissanceClient.builder()
        .id(clientId)
        .nom("Dupont")
        .adresse(new Adresse("25 avenue des Champs-Elysees", null, "75008", "Paris"))
        .build();
    
    when(repository.findById(clientId)).thenReturn(Optional.of(existing));
    when(repository.save(any())).thenReturn(newData);
    
    // When
    ConnaissanceClient result = service.modifierClient(clientId, newData);
    
    // Then
    assertThat(result).isNotNull();
    assertThat(result.getAdresse().getVille()).isEqualTo("Paris");
    
    // Vérifications
    verify(codePostauxService).validerAdresse("75008", "Paris");
    verify(adresseEventService).publishAdresseChangedEvent(newData);
    verify(repository).save(newData);
  }
  
  @Test
  @DisplayName("Devrait lever ClientNotFoundException si client inexistant")
  void shouldThrowClientNotFoundExceptionWhenClientDoesNotExist() {
    // Given
    String clientId = "unknown";
    when(repository.findById(clientId)).thenReturn(Optional.empty());
    
    // When / Then
    assertThatThrownBy(() -> service.modifierClient(clientId, ConnaissanceClient.builder().build()))
        .isInstanceOf(ClientNotFoundException.class)
        .hasMessageContaining(clientId);
    
    verifyNoInteractions(codePostauxService, adresseEventService);
  }
}
```

**Bonnes pratiques** :
- ✅ Nomenclature : `should...When...` (BDD style)
- ✅ Structure : Given / When / Then
- ✅ 1 test = 1 assertion principale
- ✅ Utiliser `@DisplayName` explicite
- ✅ Tester les cas nominaux **ET** les cas d'erreur

### Tests d'intégration (25%)

**Cible** : Interaction entre modules (API + Domain + Infrastructure)

**Frameworks** :
- Spring Boot Test
- Testcontainers (MongoDB, Kafka)
- RestAssured

**Exemple** : Test d'intégration PUT modifier-client

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ModifierClientIntegrationTest {
  
  @Container
  static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0")
      .withExposedPorts(27017);
  
  @LocalServerPort
  private int port;
  
  @Autowired
  private ConnaissanceClientRepository repository;
  
  @DynamicPropertySource
  static void setProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
  }
  
  @Test
  void shouldModifyClientSuccessfully() {
    // Given : créer un client existant
    ConnaissanceClient existing = repository.save(
        ConnaissanceClient.builder()
            .nom("Dupont")
            .adresse(new Adresse("12 rue Victor Hugo", null, "33000", "Bordeaux"))
            .build()
    );
    
    // When : modifier le client
    ModifierClientRequestDto request = new ModifierClientRequestDto(
        "Dupont",
        "Jean",
        new AdresseDto("25 avenue des Champs-Elysees", null, "75008", "Paris"),
        SituationFamiliale.MARIE,
        2
    );
    
    RestAssured.given()
        .port(port)
        .contentType(ContentType.JSON)
        .header("X-Correlation-ID", UUID.randomUUID().toString())
        .body(request)
    .when()
        .put("/v1/connaissance-clients/" + existing.getId())
    .then()
        .statusCode(200)
        .body("adresse.ville", equalTo("Paris"))
        .body("nombreEnfants", equalTo(2));
    
    // Then : vérifier en base
    ConnaissanceClient updated = repository.findById(existing.getId()).orElseThrow();
    assertThat(updated.getAdresse().getVille()).isEqualTo("Paris");
  }
}
```

**Bonnes pratiques** :
- ✅ Utiliser **Testcontainers** (environnement réaliste)
- ✅ Tester le **cycle complet** (HTTP → DB)
- ✅ Vérifier les **effets de bord** (événements Kafka, DB)

### Tests BDD (5%)

**Cible** : Scénarios utilisateur end-to-end

**Framework** : Karate

**Exemple** : Feature file

```gherkin
Feature: Modification d'un client

  Background:
    * url baseUrl
    * def clientId = '8a9204f5-aa42-47bc-9f04-17caab5deeee'
    * def correlationId = function(){ return java.util.UUID.randomUUID().toString() }

  Scenario: Modification réussie avec changement d'adresse
    Given path '/v1/connaissance-clients', clientId
    And header X-Correlation-ID = correlationId()
    And request
      """
      {
        "nom": "Dupont",
        "prenom": "Jean",
        "adresse": {
          "ligne1": "25 avenue des Champs-Élysées",
          "codePostal": "75008",
          "ville": "Paris"
        },
        "situationFamiliale": "MARIE",
        "nombreEnfants": 2
      }
      """
    When method PUT
    Then status 200
    And match response.adresse.ville == 'Paris'
    And match response.nombreEnfants == 2

  Scenario: Erreur 404 si client inexistant
    Given path '/v1/connaissance-clients/unknown-id'
    And header X-Correlation-ID = correlationId()
    And request {}
    When method PUT
    Then status 404
    And match response.error == 'CLIENT_NOT_FOUND'
```

**Exécution** :

```bash
cd tests/connaissance-client-karate
mvn test
```

### Couverture de code (JaCoCo)

**Configuration** : `pom.xml` racine

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals>
        <goal>prepare-agent</goal>
      </goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals>
        <goal>report</goal>
      </goals>
    </execution>
    <execution>
      <id>check</id>
      <goals>
        <goal>check</goal>
      </goals>
      <configuration>
        <rules>
          <rule>
            <element>PACKAGE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

**Génération du rapport** :

```bash
mvn clean verify
open target/site/jacoco/index.html
```

**Seuils minimums** :
- **Ligne** : 80%
- **Branche** : 70%
- **Méthode** : 80%

---

## 📦 Gestion des dépendances

### Maven Multi-Module

Le projet utilise un **parent POM** pour centraliser les versions.

**Structure** :

```xml
<!-- pom.xml (racine) -->
<project>
  <groupId>com.sqli.west.datalake.connaissance-client</groupId>
  <artifactId>connaissance-client</artifactId>
  <version>2.0.0</version>
  <packaging>pom</packaging>
  
  <modules>
    <module>connaissance-client-api</module>
    <module>connaissance-client-app</module>
    <module>connaissance-client-domain</module>
    <module>connaissance-client-db-adapter</module>
    <module>connaissance-client-cp-adapter</module>
    <module>connaissance-client-event-adapter</module>
  </modules>
  
  <dependencyManagement>
    <dependencies>
      <!-- Spring Boot BOM -->
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>3.5.0</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
```

### Dépendances principales

| Dépendance | Version | Usage |
|------------|---------|-------|
| **Spring Boot** | 3.5.0 | Framework applicatif |
| **Spring Data MongoDB** | 4.4.1 | Persistence NoSQL |
| **Spring Kafka** | 3.3.0 | Messaging |
| **Resilience4j** | 2.2.0 | Circuit breaker |
| **OpenAPI Generator** | 7.4.0 | Génération code API |
| **Lombok** | 1.18.30 | Réduction boilerplate |
| **MapStruct** | 1.5.5.Final | Mapping DTO ↔ Entity |
| **JUnit 5** | 5.10.1 | Tests unitaires |
| **Mockito** | 5.8.0 | Mocking |
| **Testcontainers** | 1.19.3 | Tests intégration |
| **Karate** | 1.4.1 | Tests BDD |

### Ajout d'une nouvelle dépendance

**Règles** :
1. ✅ Vérifier si la dépendance existe déjà dans `dependencyManagement`
2. ✅ Ajouter la version dans le parent POM si nouvelle
3. ✅ Éviter les dépendances transitives conflictuelles

**Exemple** : Ajouter Apache Commons Lang

**1. Parent POM** (`pom.xml` racine) :

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
      <version>3.14.0</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**2. Module POM** (ex: `connaissance-client-domain/pom.xml`) :

```xml
<dependencies>
  <dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <!-- Pas de version ici, héritée du parent -->
  </dependency>
</dependencies>
```

### Vérification des vulnérabilités

```bash
mvn dependency-check:check
```

**Rapport** : `target/dependency-check-report.html`

---

## 🔨 Build et Release

### Compilation

#### Build complet (tests + packaging)

```bash
mvn clean install
```

#### Build sans tests (rapide)

```bash
mvn clean install -DskipTests
```

#### Build avec profil spécifique

```bash
mvn clean install -Pdev
```

### Profils Maven

| Profil | Usage |
|--------|-------|
| `dev` | Développement (logs DEBUG, circuit breaker permissif) |
| `prod` | Production (logs INFO, circuit breaker strict, native image) |
| `docker` | Build image Docker |

**Activation** :

```bash
mvn clean package -Pprod
```

### Versioning (Semantic Versioning)

Format : `MAJOR.MINOR.PATCH`

- **MAJOR** : Breaking changes (ex: 1.0.0 → 2.0.0)
- **MINOR** : Nouvelles fonctionnalités compatibles (ex: 2.0.0 → 2.1.0)
- **PATCH** : Corrections de bugs (ex: 2.1.0 → 2.1.1)

**Mise à jour de version** :

```bash
mvn versions:set -DnewVersion=2.1.0
mvn versions:commit
```

### Release Process

#### 1. Préparer la release

```bash
# Créer une branche release
git checkout -b release/2.1.0

# Mettre à jour la version
mvn versions:set -DnewVersion=2.1.0
mvn versions:commit

# Mettre à jour CHANGELOG.md
# (Ajouter section ## [2.1.0] - 2025-11-22)

# Commit
git add .
git commit -m "chore: prepare release 2.1.0"
```

#### 2. Build et tests

```bash
mvn clean verify
```

#### 3. Tag Git

```bash
git tag -a v2.1.0 -m "Release version 2.1.0"
git push origin v2.1.0
```

#### 4. Build image Docker

```bash
mvn clean package -Pdocker
docker build -t connaissance-client:2.1.0 .
docker tag connaissance-client:2.1.0 registry.sqli.com/connaissance-client:2.1.0
docker push registry.sqli.com/connaissance-client:2.1.0
```

#### 5. Merge vers main

```bash
git checkout main
git merge release/2.1.0
git push origin main
```

#### 6. Incrémenter version de développement

```bash
git checkout develop
mvn versions:set -DnewVersion=2.2.0-SNAPSHOT
mvn versions:commit
git commit -am "chore: bump version to 2.2.0-SNAPSHOT"
git push origin develop
```

### CI/CD Pipeline

**Étapes** :

1. **Build** : `mvn clean compile`
2. **Tests unitaires** : `mvn test`
3. **Tests intégration** : `mvn failsafe:integration-test`
4. **Qualité code** : SonarQube
5. **Packaging** : `mvn package`
6. **Build Docker** : `docker build`
7. **Scan sécurité** : Trivy
8. **Déploiement** : Kubernetes (staging → prod)

---

## 🐛 Debugging et Troubleshooting

### Activer le debug dans l'IDE

**IntelliJ IDEA** :
1. Run configuration → **Edit Configurations**
2. **VM options** : `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005`
3. **Breakpoints** → Run en mode Debug 🐞

### Logs de debug

**Activer logs TRACE** :

```yaml
# application-dev.yml
logging:
  level:
    com.sqli.west.datalake: TRACE
    org.springframework.data.mongodb: DEBUG
    org.springframework.kafka: DEBUG
```

### Problèmes courants

#### 1. MongoDB : Connexion refusée

**Erreur** :
```
com.mongodb.MongoSocketException: Exception opening socket
```

**Solution** :
```bash
# Vérifier si MongoDB est démarré
docker ps | grep mongo

# Démarrer MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Vérifier les logs
docker logs mongodb
```

#### 2. Kafka : Broker not available

**Erreur** :
```
org.apache.kafka.common.errors.TimeoutException: Topic connaissance-client-events not present in metadata
```

**Solution** :
```bash
# Démarrer Kafka + Zookeeper
cd tests/local_kafka
docker-compose up -d

# Créer le topic manuellement
docker exec -it kafka kafka-topics --create \
  --topic connaissance-client-events \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
```

#### 3. Circuit Breaker toujours ouvert

**Symptôme** : API IGN toujours en fallback

**Solution** :
```bash
# Vérifier l'état du circuit breaker
curl http://localhost:8080/actuator/health | jq '.components.apiIgnHealthIndicator'

# Forcer la fermeture (dev uniquement)
curl -X POST http://localhost:8080/actuator/circuitbreakers/apiIgn/transition -d "CLOSED"
```

#### 4. Tests échouent avec Testcontainers

**Erreur** :
```
org.testcontainers.containers.ContainerLaunchException: Container startup failed
```

**Solution** :
```bash
# Vérifier Docker
docker ps

# Nettoyer les containers
docker system prune -a

# Vérifier les ressources
docker info | grep -i memory
```

### Profiling Performance

#### 1. Async Profiler

```bash
# Télécharger async-profiler
wget https://github.com/async-profiler/async-profiler/releases/download/v2.9/async-profiler-2.9-linux-x64.tar.gz
tar -xzf async-profiler-2.9-linux-x64.tar.gz

# Profiler l'application (PID = process ID)
./profiler.sh -d 60 -f flamegraph.html <PID>
```

#### 2. Spring Boot Actuator

```bash
# Métriques JVM
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Threads
curl http://localhost:8080/actuator/metrics/jvm.threads.live
```

---

## ⚡ Performance et Optimisation

### Bonnes pratiques

#### 1. N+1 Query Problem (MongoDB)

**❌ Problème** :

```java
// 1 requête pour liste clients + N requêtes pour adresses
List<ConnaissanceClient> clients = repository.findAll();
clients.forEach(client -> {
  Adresse adresse = adresseRepository.findByClientId(client.getId());  // N requêtes !
});
```

**✅ Solution** : Utiliser l'embedding MongoDB

```java
// 1 seule requête avec adresse embedded
@Document(collection = "clients")
public class ConnaissanceClientDocument {
  private String id;
  private String nom;
  private AdresseDocument adresse;  // Embedded, pas de JOIN
}
```

#### 2. Pagination

**❌ Problème** : `findAll()` charge tous les clients en mémoire

**✅ Solution** : Utiliser `Pageable`

```java
// Repository
Page<ConnaissanceClient> findAll(Pageable pageable);

// Controller
@GetMapping
public ResponseEntity<Page<ConnaissanceClientDto>> getClients(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
  Pageable pageable = PageRequest.of(page, size);
  Page<ConnaissanceClient> clients = service.findAll(pageable);
  return ResponseEntity.ok(clients.map(mapper::toDto));
}
```

#### 3. Cache (Spring Cache)

```java
@Service
public class ConnaissanceClientServiceImpl {
  
  @Cacheable(value = "clients", key = "#id")
  public ConnaissanceClient findById(String id) {
    return repository.findById(id).orElseThrow();
  }
  
  @CacheEvict(value = "clients", key = "#id")
  public void deleteById(String id) {
    repository.deleteById(id);
  }
}
```

**Configuration** :

```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=500,expireAfterWrite=10m
```

#### 4. Async Processing

```java
@Service
public class AdresseEventServiceImpl {
  
  @Async
  public void publishAdresseChangedEvent(ConnaissanceClient client) {
    kafkaTemplate.send("connaissance-client-events", client);
  }
}
```

**Configuration** :

```java
@Configuration
@EnableAsync
public class AsyncConfig {
  
  @Bean
  public Executor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(10);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("async-");
    executor.initialize();
    return executor;
  }
}
```

### Monitoring Performance

**Métriques clés** :
- **Latence p95** : < 500ms
- **Latence p99** : < 2s
- **Throughput** : > 100 req/s
- **Taux d'erreur** : < 1%

**Dashboard Grafana** : Voir `docs/monitoring/grafana-modifier-client.json`

---

## 🤝 Contribution

### Workflow Git

Le projet utilise **Git Flow** :

```
main           ─●────────●────────●─────→  (releases)
                │        │        │
develop        ─●────●───●───●────●─────→  (develop)
                │    │       │
feature/XXX    ─●────●       │
                             │
hotfix/YYY                   ●─────●
```

**Branches** :
- `main` : Code production
- `develop` : Développement en cours
- `feature/*` : Nouvelles fonctionnalités
- `hotfix/*` : Corrections urgentes
- `release/*` : Préparation release

### Créer une feature

```bash
# 1. Partir de develop
git checkout develop
git pull origin develop

# 2. Créer une branche feature
git checkout -b feature/ajouter-endpoint-recherche

# 3. Développer (commits réguliers)
git add .
git commit -m "feat: add search endpoint"

# 4. Pousser sur remote
git push origin feature/ajouter-endpoint-recherche

# 5. Créer une Pull Request sur GitHub/GitLab
```

### Conventional Commits

**Format** : `<type>(<scope>): <description>`

**Types** :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (sans changement logique)
- `refactor:` Refactoring
- `test:` Ajout/modification tests
- `chore:` Maintenance (dépendances, build)
- `perf:` Amélioration performance
- `ci:` CI/CD

**Exemples** :

```bash
feat(api): add GET /v1/clients/search endpoint
fix(domain): correct validation règle situation familiale
docs(readme): update installation instructions
refactor(adapter): simplify MongoDB mapping logic
test(service): add unit tests for modifierClient
chore(deps): upgrade Spring Boot to 3.5.1
```

### Revue de code (Pull Request)

**Checklist** :

- [ ] ✅ Tests ajoutés/modifiés (couverture ≥ 80%)
- [ ] ✅ Documentation mise à jour (Javadoc, README)
- [ ] ✅ Build réussi (`mvn clean verify`)
- [ ] ✅ Pas de warning SonarQube
- [ ] ✅ Conventional Commits respecté
- [ ] ✅ Code review par 1+ développeur
- [ ] ✅ CHANGELOG.md mis à jour

**Template de PR** :

```markdown
## Description
Ajoute un endpoint GET /v1/clients/search pour rechercher par nom/prénom

## Type de changement
- [x] Nouvelle fonctionnalité (feat)
- [ ] Correction de bug (fix)
- [ ] Breaking change

## Tests
- [x] Tests unitaires (5 tests ajoutés)
- [x] Tests intégration (2 tests ajoutés)
- [x] Couverture : 87.4% → 89.2%

## Checklist
- [x] Build Maven OK
- [x] SonarQube OK (0 issues)
- [x] Documentation OpenAPI mise à jour
- [x] CHANGELOG.md mis à jour

## Screenshots (si applicable)
```

---

## 📞 Support

**Questions** : Créer une issue sur GitHub/GitLab  
**Équipe** : SQLI - Data Lake Team  
**Email** : pbousquet@sqli.com  
**Documentation** : [Wiki interne](http://wiki.sqli.com/connaissance-client)

---

## 📚 Références

- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/3.5.0/reference/html/)
- [Spring Data MongoDB](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/)
- [Resilience4j User Guide](https://resilience4j.readme.io/)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Version** : 2.0.0  
**Dernière mise à jour** : 22 novembre 2025  
**Auteur** : SQLI Data Lake Team
