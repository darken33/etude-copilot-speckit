# Constitution d'Architecture - Connaissance Client

> Analyse complète du projet pour identifier les principes d'architecture et les pratiques de développement

## 1. PRINCIPES D'ARCHITECTURE

### 1.1 Architecture Hexagonale (Ports & Adapters)

Le projet implémente strictement l'architecture hexagonale avec les principes suivants :

#### **Séparation des couches**
- **Domaine (`connaissance-client-domain`)** : Cœur métier isolé sans dépendances techniques
- **Adaptateurs entrants** : API REST (`connaissance-client-api`)
- **Adaptateurs sortants** : 
  - Base de données (`connaissance-client-db-adapter`)
  - Services externes (`connaissance-client-cp-adapter`)
  - Events/Messaging (`connaissance-client-event-adapter`)
- **Application (`connaissance-client-app`)** : Orchestration et configuration Spring Boot

#### **Inversion de dépendances**
```
Règle stricte : Les dépendances pointent TOUJOURS vers le domaine
- API → Domaine ✓
- DB Adapter → Domaine ✓
- Event Adapter → Domaine ✓
- Domaine → RIEN (sauf Spring validation)
```

#### **Ports (Interfaces dans le domaine)**
Le domaine définit ses contrats via des interfaces dans `domain.ports` :
- `ClientRepository` : Contrat de persistance
- `CodePostauxService` : Contrat de validation externe
- `AdresseEventService` : Contrat de publication d'événements

**Règle** : Le domaine ne connaît QUE les interfaces, jamais les implémentations.

### 1.2 Domain-Driven Design (DDD)

#### **Modèle riche du domaine**
- Objets métier dans `domain.models` avec comportements
- Value Objects immuables (records Java) : `Adresse`, `Nom`, `Prenom`, `CodePostal`, `Ville`, `LigneAdresse`
- Entité racine : `Client` avec identité UUID
- Énumérations métier : `SituationFamiliale`

#### **Langage ubiquitaire**
Les concepts métier sont exprimés clairement :
- `ConnaissanceClient` (fiche client)
- `nouveauClient()`, `changementAdresse()`, `changementSituation()`
- `AdresseInvalideException`, `ClientInconnuException`

#### **Règles métier dans le domaine**
```java
// Validation métier dans le service domaine
if (!codePostauxService.validateCodePostal(adresse.codePostal(), adresse.ville())) 
    throw new AdresseInvalideException();
```

### 1.3 Modularité Maven Multi-modules

Structure modulaire stricte :
```
connaissance-client (parent)
├── connaissance-client-domain
├── connaissance-client-api
├── connaissance-client-db-adapter
├── connaissance-client-cp-adapter
├── connaissance-client-event-adapter
└── connaissance-client-app
```

**Règles de dépendances Maven** :
- Le domaine ne dépend de PERSONNE (sauf validation)
- Tous les adaptateurs dépendent du domaine
- L'app agrège tous les modules

## 2. PRINCIPES DE CONCEPTION

### 2.1 Immutabilité et Value Objects

**Utilisation systématique des Records Java 17+** :
```java
public record Nom(
    @NotNull 
    @Pattern(regexp = "^[a-zA-Z ,.'-]+$") 
    @Size(min = 2, max = 50) 
    String value
) implements Comparable<Nom>
```

**Avantages** :
- Immutabilité garantie
- Equals/HashCode automatiques
- Thread-safety
- Validation déclarative (Bean Validation)

### 2.2 Séparation Modèle Métier / Modèle Technique

#### **3 modèles distincts** :
1. **Modèle domaine** : `Client` (dans domain)
2. **Modèle DB** : `ClientDb` (entité MongoDB dans db-adapter)
3. **Modèle DTO** : `ConnaissanceClientDto` (généré depuis OpenAPI dans api)

#### **Mappers dédiés** :
- `ClientDbMapper` (MapStruct) : Domain ↔ DB
- Mapping manuel dans `ConnaissanceClientDelegate` : Domain ↔ DTO

**Règle** : Aucune annotation technique (JPA, Jackson, etc.) dans le domaine.

### 2.3 API-First avec OpenAPI

#### **Spécification OpenAPI 3.0**
- Définition complète dans `connaissance-client-api.yaml`
- Documentation enrichie (descriptions, cas d'usage, exemples)
- Génération automatique des contrôleurs et DTOs

#### **Génération de code** :
```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <!-- Génère : ConnaissanceClientApiDelegate, DTOs, etc. -->
</plugin>
```

**Pattern Delegate** : Le contrôleur généré délègue à une implémentation métier (`ConnaissanceClientDelegate`).

### 2.4 Event-Driven Architecture

#### **AsyncAPI 3.0 pour les événements**
- Spécification dans `adresse-asyncapi-3.yaml`
- Génération de producers/consumers avec ZenWave SDK
- Canal Kafka : `event.adresse.v1`

#### **Publication d'événements** :
```java
// Dans ConnaissanceClientServiceImpl
private void sendAdresseEvent(Client client) {
    adresseEventService.sendEvent(
        client.getId(), 
        new Destinataire(client.getNom(), client.getPrenom()), 
        client.getAdresse()
    );
}
```

**Pattern** : Publication après chaque modification d'adresse (nouveau client ou changement).

## 3. PRATIQUES DE DÉVELOPPEMENT

### 3.1 Test-Driven Development (TDD)

#### **Couverture de tests à 3 niveaux** :

1. **Tests unitaires du domaine** :
   - `AdresseTest` : Tests des Value Objects
   - `ClientTest` : Tests de l'entité Client
   - `ConnaissanceClientServiceImplTest` : Tests du service avec mocks

2. **Tests unitaires des adaptateurs** :
   - `ClientDbMapperTest` : Mapping Domain ↔ DB
   - `ClientRepositoryImplTest` : Repository avec mock
   - `ConnaissanceClientDelegateTest` : Contrôleur API avec mocks

3. **Tests d'intégration** :
   - `ConnaissanceClientApiIT` : Tests complets de bout en bout
   - Tests Karate (BDD) : `ITCC-CREATE-API.feature`, etc.

#### **Stratégie de tests** :
```java
@Test
public void given_connaissance_client_not_null_get_should_return_data() {
    // GIVEN - Setup
    // WHEN - Action
    // THEN - Assertions
}
```

**Convention** : Pattern Given-When-Then systématique.

### 3.2 Gestion des Exceptions Métier

#### **Exceptions checked** :
- `AdresseInvalideException` : Validation d'adresse échouée
- `ClientInconnuException` : Client non trouvé

**Gestion par couche** :
```java
// Service domaine : throw exception métier
throw new AdresseInvalideException();

// Contrôleur API : conversion en HTTP status
catch (AdresseInvalideException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
}
```

### 3.3 Injection de Dépendances et Configuration Spring

#### **Wiring des implémentations** :
```java
@SpringBootApplication
@EnableMongoRepositories
@EnableWebSecurity
public class ConnaissanceClientApplication {
    
    @Bean
    public ConnaissanceClientService connaissanceClientService(
        ClientRepository repository,
        CodePostauxService codePostauxService,
        AdresseEventService adresseEventService
    ) {
        return new ConnaissanceClientServiceImpl(
            repository, codePostauxService, adresseEventService
        );
    }
}
```

**Règle** : Configuration centralisée dans le module `app`, les autres modules sont agnostiques Spring.

### 3.4 Génération de Code

#### **Outils de génération utilisés** :

1. **OpenAPI Generator** (API REST) :
   - Contrôleurs Spring
   - DTOs avec validation Bean Validation
   - Documentation Swagger UI

2. **ZenWave SDK** (AsyncAPI) :
   - Producers Kafka
   - Schemas JSON/POJO
   - Configuration Spring Cloud Stream

3. **MapStruct** (Mapping) :
   - Génération automatique des implémentations de mappers
   - Type-safe à la compilation

**Avantage** : Contract-first, cohérence garantie entre spec et code.

## 4. STACK TECHNIQUE

### 4.1 Socle Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Java | 21 | Langage (records, pattern matching, etc.) |
| Spring Boot | 3.5.0 | Framework application |
| Spring Data MongoDB | 3.x | Persistence NoSQL |
| Spring Cloud Stream | 2025.0.0 | Messaging (Kafka) |
| Maven | 3.x | Build et gestion dépendances |

### 4.2 Frameworks et Librairies

| Outil | Usage |
|-------|-------|
| Lombok | Réduction boilerplate (pas dans Value Objects) |
| MapStruct | Mapping type-safe |
| OpenAPI Generator | Génération API REST |
| ZenWave SDK | Génération AsyncAPI |
| Springdoc OpenAPI | Documentation Swagger |
| JUnit 5 | Tests unitaires |
| Mockito | Mocking pour tests |
| Karate | Tests BDD/API |

### 4.3 Qualité et Observabilité

| Outil | Configuration |
|-------|---------------|
| JaCoCo | Couverture de code (XML format) |
| Maven Failsafe | Tests d'intégration (`**/*IT.java`) |
| Spring Actuator | Métriques et health checks |
| Micrometer Prometheus | Métriques (export Prometheus) |
| OWASP Dependency Check | Analyse vulnérabilités (désactivé par défaut) |

### 4.4 Sécurité

**Configuration** :
- Spring Security (OAuth2 Resource Server)
- JWT Bearer Token : `jwt.url-public-key` (Keycloak)
- `@SecurityScheme(type = HTTP, scheme = bearer)`

**Endpoints** :
```yaml
/v3/api-docs           # OpenAPI spec
/swagger-ui.html       # Documentation interactive
/actuator/prometheus   # Métriques
/actuator/health       # Health checks
```

## 5. RÈGLES DE DÉVELOPPEMENT

### 5.1 Règles Domaine

✅ **À FAIRE** :
- Placer toute la logique métier dans le domaine
- Utiliser des Value Objects immuables (records)
- Définir des interfaces (ports) pour les dépendances externes
- Lever des exceptions métier explicites
- Valider avec Bean Validation (`@NotNull`, `@Pattern`, etc.)

❌ **À NE PAS FAIRE** :
- Ajouter des dépendances techniques (Spring Data, Jackson, etc.)
- Référencer des classes d'adaptateurs
- Mettre de la logique métier dans les contrôleurs ou repositories
- Utiliser des classes mutables pour les Value Objects

### 5.2 Règles Adaptateurs

✅ **À FAIRE** :
- Implémenter les ports définis par le domaine
- Gérer les conversions Modèle Domaine ↔ Modèle Technique
- Isoler la logique technique (DB, HTTP, messaging)
- Annoter avec Spring (`@Component`, `@Repository`, etc.)

❌ **À NE PAS FAIRE** :
- Exposer des types techniques au domaine
- Mettre de la logique métier dans les mappers
- Coupler plusieurs adaptateurs entre eux

### 5.3 Règles de Tests

✅ **Couverture obligatoire** :
- Tests unitaires pour chaque classe domaine
- Tests unitaires pour chaque mapper
- Tests d'intégration pour les API (`*IT.java`)
- Pattern Given-When-Then

✅ **Pratiques** :
- Mocker les dépendances externes
- Utiliser des données de test réalistes
- Tester les cas nominaux ET les cas d'erreur
- Vérifier les exceptions levées

### 5.4 Règles de Configuration

✅ **Configuration externalisée** :
```yaml
# application.yml
spring:
  data.mongodb.uri: ${MONGODB_URI:mongodb://localhost:27017}
  cloud.stream.bindings:
    send-adresse-message-out-0:
      destination: event.adresse.v1
```

✅ **Profiles Spring** : Support de profils pour dev/test/prod

## 6. PATTERNS ET CONVENTIONS

### 6.1 Naming Conventions

**Packages** :
```
com.sqli.workshop.ddd.connaissance.client
├── domain
│   ├── models (Client, types/*)
│   ├── ports (interfaces)
│   ├── enums
│   └── exceptions
├── api (ConnaissanceClientDelegate)
├── db (ClientRepositoryImpl, ClientDbMapper)
├── cpostal (CodePostauxServiceImpl)
└── event (AdresseEventServiceImpl)
```

**Classes** :
- Services : `*Service`, `*ServiceImpl`
- Repositories : `*Repository`, `*RepositoryImpl`
- Mappers : `*Mapper` (interface MapStruct)
- Entities DB : `*Db` (ex: `ClientDb`)
- DTOs : `*Dto` (généré)
- Tests : `*Test` (unitaires), `*IT` (intégration)

### 6.2 Pattern Repository

```java
public interface ClientRepository {
    List<Client>     lister();
    Optional<Client> lire(UUID id);
    Client           enregistrer(Client client);
    void             supprimer(UUID id);
}
```

**Convention** : Méthodes en français (langage ubiquitaire métier).

### 6.3 Pattern Service

```java
@AllArgsConstructor
public class ConnaissanceClientServiceImpl implements ConnaissanceClientService {
    private final ClientRepository repository;
    private final CodePostauxService codePostauxService;
    private final AdresseEventService adresseEventService;
    
    // Méthodes métier avec validation et orchestration
}
```

**Convention** : Injection par constructeur (final fields).

### 6.4 Pattern Mapper (MapStruct)

```java
@Mapper(componentModel = "spring")
public interface ClientDbMapper {
    @Mapping(source = "nom.value", target = "nom")
    ClientDb mapFromDomain(Client client);
    
    Client mapToDomain(ClientDb clientDb);
}
```

**Convention** : Interface avec annotations MapStruct, implémentation générée.

## 7. CONTAINERISATION ET DÉPLOIEMENT

### 7.1 Docker

**Dockerfile** :
- Base image : `azul/zulu-openjdk:17-jdk-crac-latest`
- Support CRaC (Coordinated Restore at Checkpoint)
- Certificat custom pour API externe (IGN)

### 7.2 Kubernetes

**Manifests dans `k8s/`** :
- `cclient-deployment.yaml` : Deployment
- `cclient-service.yaml` : Service
- `cclient-ingress.yaml` : Ingress

### 7.3 Build Natif

**GraalVM Native Image** :
```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <image>
            <builder>paketobuildpacks/builder:tiny</builder>
            <env>
                <BP_NATIVE_IMAGE>true</BP_NATIVE_IMAGE>
            </env>
        </image>
    </configuration>
</plugin>
```

**AOT Processing** : Préparation pour compilation native avec Spring AOT.

## 8. DOCUMENTATION

### 8.1 Documentation Architecture

**AsciiDoc** : `architecture/dossier-architecture-technique-cclient.adoc`
- Diagrammes C4 Model (DrawIO, Structurizr DSL)
- Diagrammes d'architecture hexagonale
- Pile logicielle
- Guide TDD

### 8.2 Documentation API

**Swagger UI** : Accessible à `/swagger-ui.html`
- Généré depuis OpenAPI 3.0
- Documentation détaillée des endpoints
- Try-it-out interactif

### 8.3 README

**README.adoc** : Instructions de build et run
- Build : `mvn clean package`
- Image native : `cd connaissance-client-app && mvn spring-boot:build-image`
- Run : Docker ou executable JAR

## 9. CONCLUSION

### Principes Clés à Respecter

1. **Isolation du domaine** : Le cœur métier est totalement découplé
2. **Contract-first** : API et Events définis avant implémentation
3. **Immutabilité** : Value Objects immuables (records)
4. **Inversion de dépendances** : Tout dépend du domaine
5. **Séparation des modèles** : Domaine ≠ DB ≠ DTO
6. **TDD** : Tests avant code
7. **Génération de code** : Maximiser l'automatisation
8. **Configuration externalisée** : 12-factor app

### Architecture Cible

```
┌─────────────────────────────────────────────────────────┐
│                     API REST (OpenAPI)                   │
│                 ConnaissanceClientDelegate               │
└─────────────────────────┬───────────────────────────────┘
                          │ Dépend de
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    DOMAINE MÉTIER                        │
│  ConnaissanceClientService, Client, Value Objects, Ports │
└─────┬───────────────────┬───────────────────────┬───────┘
      │                   │                       │
      │ Implémenté par    │ Implémenté par        │ Implémenté par
      ▼                   ▼                       ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ DB Adapter  │  │  CP Adapter     │  │  Event Adapter   │
│  (MongoDB)  │  │ (API externe)   │  │    (Kafka)       │
└─────────────┘  └─────────────────┘  └──────────────────┘
```

Cette architecture garantit :
- ✅ Testabilité maximale
- ✅ Évolutivité (ajout d'adaptateurs sans impact domaine)
- ✅ Maintenabilité (isolation des responsabilités)
- ✅ Portabilité (domaine réutilisable)
