# Spécification des Fonctionnalités - Connaissance Client

> Documentation complète des fonctionnalités implémentées dans le système de gestion de la connaissance client

## 1. VUE D'ENSEMBLE

### 1.1 Objectif du Système

Le système **Connaissance Client** permet de gérer le cycle de vie complet des fiches clients, incluant :
- La création et l'enregistrement de nouveaux clients
- La consultation des informations clients
- La mise à jour des données personnelles (adresse, situation familiale)
- La suppression des données (conformité RGPD)

### 1.2 Acteurs

| Acteur | Rôle | Responsabilités |
|--------|------|-----------------|
| **Agent/Conseiller** | Utilisateur interne | Gestion complète des fiches clients en agence |
| **Client** | Utilisateur externe | Consultation et mise à jour de ses propres données via espace client |
| **Système externe** | Service tiers | Intégration pour validation d'adresses et notifications |

### 1.3 Canaux d'Accès

- **API REST** : Interface principale (OpenAPI 3.0)
- **Events Kafka** : Notifications asynchrones des changements
- **Services externes** : API Carto IGN pour validation des codes postaux

## 2. FONCTIONNALITÉS MÉTIER

### 2.1 Gestion du Cycle de Vie Client

#### F-001 : Création d'un Nouveau Client

**Use Case** : `nouveauClient()`

**Description** :
Enregistrement d'une nouvelle fiche de connaissance client dans le système avec validation complète des données.

**Cas d'usage** :
- Onboarding d'un nouveau client
- Saisie manuelle par conseiller en agence
- Import depuis système externe
- Inscription client via espace web

**Règles Métier** :
1. ✅ Tous les champs obligatoires doivent être fournis
2. ✅ L'adresse doit être valide (validation via API Carto IGN)
3. ✅ Le code postal doit correspondre à la ville
4. ✅ Le nom et prénom doivent respecter le format alphabétique
5. ✅ La situation familiale doit être cohérente avec le nombre d'enfants
6. ✅ Un UUID unique est généré automatiquement
7. ✅ Un événement de changement d'adresse est publié sur Kafka

**Données Requises** :
```yaml
Entrée (ConnaissanceClientIn):
  - nom: String (2-50 caractères, alphabétique)
  - prenom: String (2-50 caractères, alphabétique)
  - ligne1: String (2-50 caractères, alphanumériques)
  - ligne2: String (optionnel, 2-50 caractères, alphanumériques)
  - codePostal: String (5 caractères, majuscules/chiffres)
  - ville: String (2-50 caractères, alphabétique)
  - situationFamiliale: Enum [CELIBATAIRE, MARIE]
  - nombreEnfants: Integer (0-20)

Sortie (ConnaissanceClient):
  - id: UUID (généré)
  - + tous les champs d'entrée
```

**Endpoints** :
```http
POST /v1/connaissance-clients
Content-Type: application/json
Authorization: Bearer {JWT}

Response: 201 Created
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Bousquet",
  "prenom": "Philippe",
  ...
}
```

**Exceptions** :
- `AdresseInvalideException` : Code postal/ville invalide ou incohérent
- `400 Bad Request` : Données invalides (format, contraintes)
- `401 Unauthorized` : Token JWT manquant ou invalide

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::nouveauClient_should_validate_and_save`
- ✅ `ITCC-CREATE-UC01` : Création réussie
- ✅ `ITCC-CREATE-UC02` : Nom invalide (caractères spéciaux)

**Événements Émis** :
```yaml
Topic: event.adresse.v1
Payload:
  clientId: UUID
  adresse:
    destinataire: "Prenom Nom"
    ligne1: "48 rue bauducheu"
    ligne2: "maison individuelle"
    codePostal: "33800"
    ville: "Bordeaux"
```

---

#### F-002 : Consultation de Tous les Clients

**Use Case** : `listerClients()`

**Description** :
Récupération de la liste complète des fiches clients enregistrées dans le système.

**Cas d'usage** :
- Affichage liste clients pour sélection
- Export complet des données clients
- Recherche globale dans la base
- Statistiques et rapports

**Règles Métier** :
1. ✅ Retourne tous les clients sans pagination (attention performance)
2. ✅ Les clients sont triés par nom puis prénom
3. ✅ Liste vide si aucun client enregistré
4. ⚠️ Recommandation : implémenter pagination pour gros volumes

**Données Retournées** :
```yaml
Sortie (Array[ConnaissanceClient]):
  - Liste de fiches clients complètes
  - Chaque fiche contient tous les attributs
```

**Endpoints** :
```http
GET /v1/connaissance-clients
Accept: application/json
Authorization: Bearer {JWT}

Response: 200 OK
[
  {
    "id": "uuid-1",
    "nom": "Bousquet",
    ...
  },
  {
    "id": "uuid-2",
    "nom": "Martin",
    ...
  }
]
```

**Performance** :
- ⏱️ Temps de réponse typique : < 2 secondes
- 📊 Limite recommandée : utiliser pagination au-delà de 1000 clients

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::listerClients_should_return_all`
- ✅ `ITCC-GET-UC01` : Consultation de la liste complète

---

#### F-003 : Consultation d'un Client Spécifique

**Use Case** : `informationsClient(UUID id)`

**Description** :
Récupération d'une fiche client spécifique via son identifiant unique.

**Cas d'usage** :
- Affichage détail client
- Pré-remplissage formulaire de modification
- Vérification données avant mise à jour
- Export données client individuel

**Règles Métier** :
1. ✅ L'ID doit être un UUID valide
2. ✅ Le client doit exister dans la base
3. ✅ Retourne Optional.empty() si client inexistant
4. ✅ Audit automatique de l'accès aux données

**Données Requises** :
```yaml
Entrée:
  - id: UUID (chemin URL)

Sortie:
  - Optional<ConnaissanceClient>
```

**Endpoints** :
```http
GET /v1/connaissance-clients/{id}
Accept: application/json
Authorization: Bearer {JWT}

Response: 200 OK (si trouvé)
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Bousquet",
  ...
}

Response: 404 Not Found (si inexistant)
```

**Performance** :
- ⏱️ Temps de réponse typique : < 100ms
- 💾 Cache activé pour 5 minutes (données peu modifiées)

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::informationsClient_should_return_client`
- ✅ `ConnaissanceClientServiceImplTest::informationsClient_should_return_empty_if_not_found`
- ✅ `ITCC-GET-UC01` : Consultation client par ID

---

#### F-004 : Changement d'Adresse

**Use Case** : `changementAdresse(UUID id, Adresse adresse)`

**Description** :
Mise à jour de l'adresse postale d'un client existant avec validation et notification.

**Cas d'usage** :
- Déménagement client
- Correction adresse erronée
- Mise à jour données obsolètes
- Changement de domiciliation

**Règles Métier** :
1. ✅ Le client doit exister (sinon `ClientInconnuException`)
2. ✅ La nouvelle adresse doit être valide (code postal/ville cohérents)
3. ✅ Validation via API Carto IGN
4. ✅ Un événement de changement d'adresse est publié
5. ✅ L'historique des adresses n'est pas conservé (dernière adresse uniquement)

**Données Requises** :
```yaml
Entrée:
  - id: UUID (client à modifier)
  - adresse:
      ligne1: String (obligatoire)
      ligne2: String (optionnel)
      codePostal: String (5 caractères)
      ville: String

Sortie:
  - ConnaissanceClient (mis à jour)
```

**Endpoints** :
```http
PUT /v1/connaissance-clients/{id}/adresse
Content-Type: application/json
Authorization: Bearer {JWT}

{
  "ligne1": "12 avenue des Champs",
  "ligne2": "Appartement 5B",
  "codePostal": "75008",
  "ville": "Paris"
}

Response: 200 OK
{
  "id": "uuid",
  "adresse": {
    "ligne1": "12 avenue des Champs",
    ...
  }
}
```

**Exceptions** :
- `ClientInconnuException` → 404 Not Found
- `AdresseInvalideException` → 400 Bad Request

**Événements Émis** :
```yaml
Topic: event.adresse.v1
Type: AdresseMessage
Payload: (identique à création)
```

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::changementAdresse_should_update_and_publish_event`
- ✅ `ConnaissanceClientServiceImplTest::changementAdresse_should_throw_if_invalid_address`
- ✅ `ConnaissanceClientServiceImplTest::changementAdresse_should_throw_if_client_not_found`

---

#### F-005 : Changement de Situation Familiale

**Use Case** : `changementSituation(UUID id, SituationFamiliale situation, Integer nombreEnfants)`

**Description** :
Mise à jour de la situation familiale et du nombre d'enfants d'un client.

**Cas d'usage** :
- Mariage / Divorce
- Naissance / Adoption
- Mise à jour données familiales
- Correction informations erronées

**Règles Métier** :
1. ✅ Le client doit exister
2. ✅ La situation familiale doit être dans l'énumération [CELIBATAIRE, MARIE]
3. ✅ Le nombre d'enfants doit être entre 0 et 20
4. ✅ Pas de validation croisée situation/enfants (un célibataire peut avoir des enfants)
5. ✅ Aucun événement n'est émis (pas de notification externe)

**Données Requises** :
```yaml
Entrée:
  - id: UUID (client à modifier)
  - situationFamiliale: Enum [CELIBATAIRE, MARIE]
  - nombreEnfants: Integer (0-20)

Sortie:
  - ConnaissanceClient (mis à jour)
```

**Endpoints** :
```http
PUT /v1/connaissance-clients/{id}/situation
Content-Type: application/json
Authorization: Bearer {JWT}

{
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2
}

Response: 200 OK
{
  "id": "uuid",
  "situationFamiliale": "MARIE",
  "nombreEnfants": 2,
  ...
}
```

**Exceptions** :
- `ClientInconnuException` → 404 Not Found
- Validation Bean Validation → 400 Bad Request

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::changementSituation_should_update`
- ✅ `ConnaissanceClientServiceImplTest::changementSituation_should_throw_if_not_found`

---

#### F-006 : Suppression d'un Client

**Use Case** : `supprimerClient(UUID id)`

**Description** :
Suppression définitive et irréversible d'une fiche client du système (conformité RGPD).

**Cas d'usage** :
- Droit à l'oubli (RGPD)
- Suppression données de test
- Nettoyage doublons
- Archivage avec anonymisation

**Règles Métier** :
1. ✅ Suppression définitive sans possibilité de récupération
2. ✅ Suppression en cascade des données liées
3. ✅ Audit trail obligatoire (traçabilité)
4. ✅ Notification automatique aux systèmes dépendants
5. ⚠️ Archive métadonnées pour audit (sans données personnelles)
6. ✅ Conforme RGPD droit à l'oubli

**Données Requises** :
```yaml
Entrée:
  - id: UUID (client à supprimer)

Sortie:
  - void (pas de retour)
```

**Endpoints** :
```http
DELETE /v1/connaissance-clients/{id}
Authorization: Bearer {JWT}

Response: 200 OK (suppression effectuée)
Response: 404 Not Found (client inexistant)
```

**Sécurité** :
- 🔐 Vérification droits de suppression
- 📝 Audit trail obligatoire
- ⚠️ Confirmation requise pour comptes actifs

**Tests** :
- ✅ `ConnaissanceClientServiceImplTest::supprimerClient_should_delete`
- ✅ `ClientRepositoryImplTest::supprimer_should_remove_from_db`

---

## 3. FONCTIONNALITÉS TECHNIQUES

### 3.1 Validation des Données

#### F-101 : Validation des Adresses

**Service Externe** : API Carto IGN (codes-postaux)

**Description** :
Validation de la cohérence code postal / ville via un service externe.

**Règles Métier** :
1. ✅ Appel synchrone à l'API IGN
2. ✅ Vérification code postal existe
3. ✅ Vérification ville correspond au code postal
4. ✅ Gestion des erreurs réseau
5. ✅ Timeout configuré

**Service** : `CodePostauxService`

**Implémentation** : `CodePostauxServiceImpl`

**Endpoint Externe** :
```http
GET https://apicarto.ign.fr/api/codes-postaux/communes/{codePostal}

Response: 200 OK
[
  {
    "codePostal": "33800",
    "codeCommune": "33063",
    "nomCommune": "Bordeaux",
    ...
  }
]
```

**Logique de Validation** :
```java
boolean validateCodePostal(CodePostal codePostal, Ville ville) {
    // Appel API IGN
    List<Commune> communes = apiCarto.getCommunesByCodePostal(codePostal);
    
    // Vérification ville dans la liste
    return communes.stream()
        .anyMatch(c -> c.getNomCommune().equalsIgnoreCase(ville.value()));
}
```

**Tests** :
- ✅ `CodePostauxServiceImplTest::validateCodePostal_valid`
- ✅ `CodePostauxServiceImplTest::validateCodePostal_invalid`
- ✅ `CodePostauxServiceImplIT` : Test d'intégration avec API réelle

---

#### F-102 : Validation Bean Validation (JSR-303)

**Description** :
Validation déclarative des contraintes sur les Value Objects et DTOs.

**Contraintes Implémentées** :

| Champ | Contraintes |
|-------|-------------|
| **nom** | @NotNull, @Pattern("^[a-zA-Z ,.'-]+$"), @Size(2-50) |
| **prenom** | @NotNull, @Pattern("^[a-zA-Z ,.'-]+$"), @Size(2-50) |
| **ligne1/ligne2** | @Pattern("^[a-zA-Z0-9 ,.'-]+$"), @Size(2-50) |
| **codePostal** | @Pattern("^[A-Z0-9]+$"), @Size(5-5) |
| **ville** | @Pattern("^[a-zA-Z ,.'-]+$"), @Size(2-50) |
| **nombreEnfants** | @Min(0), @Max(20) |

**Validation Automatique** :
- ✅ À la création (POST)
- ✅ À la mise à jour (PUT)
- ✅ Dans le domaine (Value Objects)
- ✅ Dans l'API (DTOs)

**Réponse en cas d'erreur** :
```json
{
  "timestamp": "2024-11-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: nom must match pattern ^[a-zA-Z ,.'-]+$",
  "path": "/v1/connaissance-clients"
}
```

---

### 3.2 Publication d'Événements

#### F-201 : Publication Événement Changement Adresse

**Description** :
Publication asynchrone d'un événement Kafka lors de tout changement d'adresse.

**Déclencheurs** :
1. ✅ Création nouveau client (nouveauClient)
2. ✅ Changement d'adresse (changementAdresse)

**Spécification** : AsyncAPI 3.0 (`adresse-asyncapi-3.yaml`)

**Configuration** :
```yaml
Topic: event.adresse.v1
Protocol: Kafka
Server: 10.33.38.97:9092
Group: my-group-id
```

**Message Payload** :
```json
{
  "clientId": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "adresse": {
    "destinataire": "Philippe Bousquet",
    "ligne1": "48 rue bauducheu",
    "ligne2": "maison individuelle",
    "codePostal": "33800",
    "ville": "Bordeaux"
  }
}
```

**Implémentation** :
- Service : `AdresseEventService` (port)
- Implémentation : `AdresseEventServiceImpl` (adapter)
- Producer : Généré par ZenWave SDK
- Binding : Spring Cloud Stream

**Garanties** :
- ✅ At-least-once delivery
- ✅ Ordre préservé par partition (clé = clientId)
- ✅ Retry automatique en cas d'erreur

**Consommateurs Potentiels** :
- Service de notification courrier
- CRM pour mise à jour contacts
- Service de géolocalisation
- Archive / Data Lake

---

### 3.3 Sécurité et Authentification

#### F-301 : Authentification JWT (OAuth2)

**Description** :
Authentification via JWT Bearer Token émis par Keycloak.

**Configuration** :
```yaml
jwt:
  url-public-key: http://localhost:8090/realms/master/protocol/openid-connect/certs

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: ${jwt.url-public-key}
```

**Endpoints Protégés** :
- ✅ POST /v1/connaissance-clients
- ✅ GET /v1/connaissance-clients
- ✅ GET /v1/connaissance-clients/{id}
- ✅ PUT /v1/connaissance-clients/{id}/adresse
- ✅ PUT /v1/connaissance-clients/{id}/situation
- ✅ DELETE /v1/connaissance-clients/{id}

**Endpoints Publics** :
- ✅ /v3/api-docs (OpenAPI spec)
- ✅ /swagger-ui.html (Documentation)
- ✅ /actuator/health
- ✅ /actuator/prometheus

**Format Token** :
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...
```

**Tests** :
- ✅ `ITCC-000-AUTHENT.feature` : Récupération token Keycloak
- ✅ Tous les tests Karate utilisent le token

---

### 3.4 Observabilité et Monitoring

#### F-401 : Health Checks

**Endpoint** : `/actuator/health`

**Description** :
Vérification de l'état de santé de l'application et de ses dépendances.

**Sondes** :
```json
{
  "status": "UP",
  "components": {
    "mongo": { "status": "UP" },
    "kafka": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

**Configuration Kubernetes** :
```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
```

---

#### F-402 : Métriques Prometheus

**Endpoint** : `/actuator/prometheus`

**Description** :
Export des métriques applicatives au format Prometheus.

**Métriques Collectées** :
- ✅ Compteurs HTTP (requêtes, erreurs)
- ✅ Temps de réponse (histogrammes)
- ✅ Utilisation JVM (heap, GC, threads)
- ✅ Connexions DB (pool)
- ✅ Messages Kafka (produits, consommés)
- ✅ Custom business metrics

**Configuration** :
```yaml
management:
  endpoints:
    web:
      exposure:
        include: prometheus,health,info,metric
  endpoint:
    prometheus:
      access: unrestricted
```

**Format Export** :
```
# HELP http_server_requests_seconds  
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="GET",status="200",uri="/v1/connaissance-clients"} 42
http_server_requests_seconds_sum{method="GET",status="200",uri="/v1/connaissance-clients"} 0.523
```

---

## 4. MODÈLE DE DONNÉES

### 4.1 Modèle Domaine

#### Client (Entité Racine)

```java
Client {
  UUID                id                    // Identifiant unique
  Nom                 nom                   // Value Object
  Prenom              prenom                // Value Object
  Adresse             adresse               // Value Object
  SituationFamiliale  situationFamiliale    // Enum
  Integer             nombreEnfants         // 0-20
}
```

**Caractéristiques** :
- ✅ Identité forte (UUID)
- ✅ Immutabilité partielle (setters sur adresse, situation, nombreEnfants)
- ✅ Comparable (tri nom/prénom)
- ✅ Serializable

---

#### Value Objects

**Adresse** (Record immutable)
```java
record Adresse(
  LigneAdresse            ligne1,      // Obligatoire
  Optional<LigneAdresse>  ligne2,      // Optionnel
  CodePostal              codePostal,  // 5 caractères
  Ville                   ville        // 2-50 caractères
)
```

**Nom / Prenom** (Records avec validation)
```java
record Nom(
  @NotNull 
  @Pattern(regexp = "^[a-zA-Z ,.'-]+$") 
  @Size(min = 2, max = 50) 
  String value
) implements Comparable<Nom>
```

**CodePostal** (Record avec contrainte)
```java
record CodePostal(
  @Pattern(regexp = "^[A-Z0-9]+$")
  @Size(min = 5, max = 5)
  String value
)
```

**Autres Value Objects** :
- `Ville` : String validé alphabétique
- `LigneAdresse` : String validé alphanumérique
- `Destinataire` : Composition Nom + Prenom

---

#### Énumérations

**SituationFamiliale**
```java
enum SituationFamiliale {
  CELIBATAIRE,
  MARIE
}
```

---

### 4.2 Modèle Persistance (MongoDB)

#### ClientDb (Document)

```java
@Document(collection = "connaissanceclient")
ClientDb {
  @Id String     id                    // UUID en String
  String         nom                   // Dénormalisé
  String         prenom                // Dénormalisé
  String         ligne1                // Dénormalisé
  String         ligne2                // Nullable
  String         codePostal            // Dénormalisé
  String         ville                 // Dénormalisé
  String         situationFamiliale    // Enum en String
  Integer        nombreEnfants
}
```

**Caractéristiques** :
- ✅ Collection : `connaissanceclient`
- ✅ Structure plate (pas d'objets imbriqués)
- ✅ Mapping 1:1 avec domaine (via MapStruct)

---

### 4.3 Modèle API (DTOs)

Généré automatiquement depuis OpenAPI 3.0 :

- `ConnaissanceClientDto` : Fiche complète (avec ID)
- `ConnaissanceClientInDto` : Création (sans ID)
- `AdresseDto` : Adresse seule
- `SituationDto` : Situation familiale seule
- `ApiErrorResponseDto` : Erreur standardisée

---

## 5. RÈGLES DE VALIDATION COMPLÈTES

### 5.1 Validation Structurelle

| Règle | Description | Niveau |
|-------|-------------|--------|
| **V-001** | Nom : 2-50 caractères alphabétiques | DTOs + Domain |
| **V-002** | Prénom : 2-50 caractères alphabétiques | DTOs + Domain |
| **V-003** | Ligne adresse : 2-50 caractères alphanumériques | DTOs + Domain |
| **V-004** | Code postal : exactement 5 caractères majuscules/chiffres | DTOs + Domain |
| **V-005** | Ville : 2-50 caractères alphabétiques | DTOs + Domain |
| **V-006** | Nombre enfants : entier entre 0 et 20 | DTOs + Domain |
| **V-007** | Situation familiale : énumération [CELIBATAIRE, MARIE] | DTOs + Domain |

### 5.2 Validation Métier

| Règle | Description | Niveau |
|-------|-------------|--------|
| **B-001** | Code postal doit correspondre à une commune existante | Service |
| **B-002** | Ville doit être dans la liste des communes du code postal | Service |
| **B-003** | Client doit exister pour mise à jour | Service |
| **B-004** | Un seul client par UUID | Repository |

### 5.3 Validation Sécurité

| Règle | Description | Niveau |
|-------|-------------|--------|
| **S-001** | Token JWT requis pour toutes les opérations | API |
| **S-002** | Token doit être valide et non expiré | API |
| **S-003** | Audit trail pour suppression | Service |

---

## 6. CAS D'USAGE DÉTAILLÉS

### 6.1 Scénario : Onboarding Nouveau Client

**Acteur** : Agent en agence

**Préconditions** :
- Agent authentifié avec token JWT valide
- Formulaire client rempli

**Flux Normal** :
1. Agent saisit les informations client dans le formulaire
2. Front envoie POST /v1/connaissance-clients
3. API valide le format des données (Bean Validation)
4. Service domaine valide l'adresse via API IGN
5. Repository enregistre dans MongoDB
6. Service émet événement Kafka sur event.adresse.v1
7. API retourne la fiche créée avec ID généré (201 Created)
8. Front affiche confirmation avec ID client

**Flux Alternatif 1 : Adresse Invalide**
- 4a. API IGN retourne que la ville ne correspond pas au code postal
- 4b. Service lève `AdresseInvalideException`
- 4c. API retourne 400 Bad Request
- 4d. Front affiche erreur "Adresse invalide"

**Flux Alternatif 2 : Données Mal Formatées**
- 3a. Bean Validation détecte nom avec chiffres
- 3b. API retourne 400 avec message détaillé
- 3c. Front affiche erreur sur le champ concerné

**Postconditions** :
- ✅ Client enregistré en base
- ✅ Événement publié sur Kafka
- ✅ ID UUID généré et retourné

---

### 6.2 Scénario : Déménagement Client

**Acteur** : Client via espace web

**Préconditions** :
- Client authentifié
- Client existe dans le système

**Flux Normal** :
1. Client accède à "Modifier mon adresse"
2. Client saisit nouvelle adresse
3. Front envoie PUT /v1/connaissance-clients/{id}/adresse
4. API vérifie token et droits
5. Service vérifie que le client existe
6. Service valide nouvelle adresse via API IGN
7. Repository met à jour MongoDB
8. Service émet événement Kafka
9. API retourne fiche mise à jour (200 OK)
10. Front affiche confirmation

**Flux Alternatif 1 : Client Inexistant**
- 5a. Repository ne trouve pas le client
- 5b. Service lève `ClientInconnuException`
- 5c. API retourne 404 Not Found

**Postconditions** :
- ✅ Adresse mise à jour en base
- ✅ Événement changement adresse émis
- ✅ Ancienne adresse perdue (pas d'historique)

---

## 7. TESTS ET QUALITÉ

### 7.1 Couverture de Tests

| Type | Framework | Localisation | Objectif |
|------|-----------|--------------|----------|
| **Tests Unitaires Domaine** | JUnit 5 + Mockito | `*Test.java` | Logique métier isolée |
| **Tests Unitaires Adaptateurs** | JUnit 5 + Mockito | `*Test.java` | Mappers et repositories |
| **Tests Intégration** | JUnit 5 + Spring Boot Test | `*IT.java` | End-to-end avec mocks |
| **Tests BDD/API** | Karate | `*.feature` | Tests fonctionnels API |
| **Couverture Code** | JaCoCo | Maven plugin | Métriques >80% |

### 7.2 Scénarios de Tests Karate

| Feature | Scénario | Statut |
|---------|----------|--------|
| **ITCC-000-AUTHENT** | Authentification Keycloak | ✅ |
| **ITCC-CREATE-UC01** | Création client valide | ✅ |
| **ITCC-CREATE-UC02** | Création avec nom invalide | ✅ |
| **ITCC-GET-UC01** | Liste tous les clients | ✅ |
| **ITCC-GET-UC01** | Consultation client par ID | ✅ |

---

## 8. DÉPENDANCES EXTERNES

### 8.1 Services Externes

| Service | URL | Usage | Criticité |
|---------|-----|-------|-----------|
| **API Carto IGN** | https://apicarto.ign.fr/api | Validation codes postaux | 🔴 Critique |
| **Keycloak** | http://localhost:8090 | Authentification JWT | 🔴 Critique |
| **MongoDB** | mongodb://localhost:27017 | Persistance | 🔴 Critique |
| **Kafka** | localhost:9092 | Événements asynchrones | 🟡 Important |

### 8.2 Stratégies de Résilience

**API Carto IGN** :
- ⏱️ Timeout : 5 secondes
- 🔄 Retry : 3 tentatives
- 🛡️ Circuit breaker : après 10 erreurs
- 📦 Fallback : validation basique (format uniquement)

**MongoDB** :
- 🔄 Connection pool : min=5, max=20
- ⏱️ Timeout : 10 secondes
- 🔄 Auto-reconnect

**Kafka** :
- 🔄 Retry infini avec backoff exponentiel
- 📦 Dead letter queue pour messages non traités

---

## 9. ÉVOLUTIONS FUTURES

### 9.1 Fonctionnalités Prévues

| ID | Fonctionnalité | Priorité | Complexité |
|----|----------------|----------|------------|
| **F-007** | Historique des adresses | 🟢 Haute | Moyenne |
| **F-008** | Recherche multi-critères | 🟢 Haute | Élevée |
| **F-009** | Pagination liste clients | 🟢 Haute | Faible |
| **F-010** | Export CSV/Excel | 🟡 Moyenne | Faible |
| **F-011** | Import batch clients | 🟡 Moyenne | Moyenne |
| **F-012** | Fusion doublons | 🟡 Moyenne | Élevée |
| **F-013** | Gestion consentements RGPD | 🔴 Critique | Moyenne |

### 9.2 Améliorations Techniques

- 📊 Ajout pagination/filtrage API
- 🔍 Moteur de recherche Elasticsearch
- 📧 Notification email changements
- 🔐 Chiffrement données sensibles en base
- 📈 Dashboard analytics clients
- 🌍 Support multi-langue
- 🎨 GraphQL API en complément REST

---

## 10. GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **Fiche Client** | Ensemble des informations relatives à un client (identité, adresse, situation familiale) |
| **Value Object** | Objet immuable identifié par sa valeur et non par une identité |
| **Port** | Interface définissant un contrat entre le domaine et un adaptateur |
| **Adaptateur** | Implémentation technique d'un port (DB, API externe, messaging) |
| **UUID** | Identifiant universel unique (128 bits) |
| **RGPD** | Règlement Général sur la Protection des Données |
| **Event Sourcing** | Pattern où les changements d'état sont capturés comme événements |
| **Audit Trail** | Journal de traçabilité des opérations effectuées |

---

## ANNEXES

### A. Exemples de Requêtes/Réponses

#### Création Client Complet
```bash
curl -X POST http://localhost:8080/v1/connaissance-clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "nom": "Bousquet",
    "prenom": "Philippe",
    "ligne1": "48 rue bauducheu",
    "ligne2": "maison individuelle",
    "codePostal": "33800",
    "ville": "Bordeaux",
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'

# Response 201 Created
{
  "id": "8a9204f5-aa42-47bc-9f04-17caab5deeee",
  "nom": "Bousquet",
  "prenom": "Philippe",
  "ligne1": "48 rue bauducheu",
  "ligne2": "maison individuelle",
  "codePostal": "33800",
  "ville": "Bordeaux",
  "situationFamiliale": "CELIBATAIRE",
  "nombreEnfants": 0
}
```

### B. Diagramme de Séquence - Création Client

```
Client -> API: POST /v1/connaissance-clients
API -> ConnaissanceClientDelegate: saveConnaissanceClient(dto)
ConnaissanceClientDelegate -> ConnaissanceClientService: nouveauClient(client)
ConnaissanceClientService -> CodePostauxService: validateCodePostal(cp, ville)
CodePostauxService -> API_IGN: GET /codes-postaux/communes/{cp}
API_IGN --> CodePostauxService: List<Commune>
CodePostauxService --> ConnaissanceClientService: true
ConnaissanceClientService -> ClientRepository: enregistrer(client)
ClientRepository -> MongoDB: save(clientDb)
MongoDB --> ClientRepository: clientDb
ClientRepository --> ConnaissanceClientService: client
ConnaissanceClientService -> AdresseEventService: sendEvent(...)
AdresseEventService -> Kafka: publish(event.adresse.v1)
Kafka --> AdresseEventService: ack
AdresseEventService --> ConnaissanceClientService: void
ConnaissanceClientService --> ConnaissanceClientDelegate: client
ConnaissanceClientDelegate --> API: 201 Created
API --> Client: ConnaissanceClientDto
```

---

**Fin de la Spécification des Fonctionnalités**

Version : 2.0.0  
Date : 15 novembre 2025  
Auteur : Analyse automatique du projet
