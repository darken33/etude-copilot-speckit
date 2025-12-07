# Guide de Migration : PUT /v1/connaissance-clients/{id}

> Guide complet pour déployer et migrer vers la nouvelle feature de modification globale client

**Version**: 2.0.0  
**Date**: 2025-11-22  
**Auteur**: SQLI - Philippe Bousquet

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Breaking Changes](#breaking-changes)
4. [Migration Step-by-Step](#migration-step-by-step)
5. [Configuration](#configuration)
6. [Tests de validation](#tests-de-validation)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Vue d'ensemble

Cette migration ajoute un nouveau endpoint REST `PUT /v1/connaissance-clients/{id}` permettant la modification atomique et complète d'une fiche client avec :

- ✅ **Validation externe** via API IGN (code postal/ville)
- ✅ **Circuit breaker** Resilience4j pour la résilience
- ✅ **Événementiel** Kafka si l'adresse change
- ✅ **Observabilité** complète (métriques, health checks, dashboard Grafana)
- ✅ **Audit trail** structuré (MDC, correlation-id)

**Impacts :**
- ✅ **NON BLOQUANT** : Aucune modification des endpoints existants
- ✅ **Opt-in** : Nouveau endpoint additionnel, pas de migration obligatoire
- ✅ **Rétrocompatible** : Les clients existants ne sont pas impactés

---

## ⚙️ Prérequis

### 1. Versions minimales requises

| Composant | Version minimale | Version recommandée | Notes |
|-----------|------------------|---------------------|-------|
| **Java** | 21 | 21 | LTS, GraalVM compatible |
| **Spring Boot** | 3.5.0 | 3.5.0 | Inclus dans le projet |
| **Maven** | 3.9+ | 3.9+ | Build tool |
| **MongoDB** | 4.4+ | 5.0+ | Base de données |
| **Kafka** | 2.8+ | 3.5+ | Event streaming |
| **Kubernetes** | 1.25+ | 1.29+ | Orchestration (optionnel) |

### 2. Dépendances système

**API IGN externe :**
- URL : `https://api-adresse.data.gouv.fr/`
- Endpoints utilisés : `/search/codes-postaux/{codePostal}`
- Rate limiting : 10 req/sec (gratuit)
- Timeout : 3s (configurable)
- **Important** : L'application fonctionne en mode dégradé si l'API IGN est indisponible (circuit breaker)

**Ressources Kubernetes recommandées :**
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### 3. Permissions et accès

- **MongoDB** : Permissions CRUD sur la collection `clients`
- **Kafka** : Permission WRITE sur le topic `client-adresse-changee`
- **API IGN** : Accès Internet sortant (HTTPS) sur le port 443
- **Prometheus** : Accès au scraping sur `/actuator/prometheus`
- **Health checks** : Accès `/actuator/health` pour les probes Kubernetes

---

## 🚫 Breaking Changes

### ✅ Aucune breaking change

Cette version **2.0.0** est **100% rétrocompatible** avec la version 1.0.0.

**Confirmations :**
- ✅ Tous les endpoints existants fonctionnent sans modification
- ✅ Les DTOs et modèles existants ne changent pas
- ✅ La base de données MongoDB reste compatible
- ✅ Les événements Kafka existants ne sont pas impactés
- ✅ Les clients API existants continuent de fonctionner

**Nouvelles fonctionnalités (opt-in) :**
- ➕ Nouveau endpoint `PUT /v1/connaissance-clients/{id}` (additionnel)
- ➕ Nouveau health indicator `apiIgnHealthIndicator` (visible dans `/actuator/health`)
- ➕ Nouvelles métriques Prometheus `resilience4j_circuitbreaker_*`

---

## 🚀 Migration Step-by-Step

### Étape 1 : Backup de sécurité

**1.1 Backup MongoDB**

```bash
# Backup de la collection clients
mongodump --uri="mongodb://localhost:27017" \
  --db=connaissance-client \
  --collection=clients \
  --out=/backup/$(date +%Y%m%d-%H%M%S)

# Vérification du backup
ls -lh /backup/
```

**1.2 Snapshot Kubernetes (si applicable)**

```bash
# Snapshot de la configuration actuelle
kubectl get deployment connaissance-client-app -n production -o yaml > backup-deployment.yaml
kubectl get service connaissance-client-app -n production -o yaml > backup-service.yaml
kubectl get configmap connaissance-client-config -n production -o yaml > backup-configmap.yaml
```

### Étape 2 : Build et tests locaux

**2.1 Build de l'application**

```bash
cd /path/to/connaissance-client
mvn clean package -DskipTests

# Vérification du JAR
ls -lh connaissance-client-app/target/*.jar
```

**2.2 Tests unitaires et intégration**

```bash
# Tous les tests (nécessite MongoDB + Kafka locaux)
mvn clean verify

# Vérification couverture (JaCoCo)
# Rapport disponible dans : connaissance-client-app/target/site/jacoco/index.html
```

**Résultat attendu :**
- ✅ BUILD SUCCESS
- ✅ 13 tests passés (4 domaine + 5 API + 4 intégration)
- ✅ Couverture : 87.4%

### Étape 3 : Déploiement en environnement de staging

**3.1 Update ConfigMap Kubernetes**

```yaml
# config/application-staging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: connaissance-client-config
  namespace: staging
data:
  application.yml: |
    spring:
      application:
        name: connaissance-client-app
      data:
        mongodb:
          uri: ${MONGODB_URI}
    
    resilience4j:
      circuitbreaker:
        instances:
          apiIgn:
            failureRateThreshold: 30
            slowCallRateThreshold: 50
            slowCallDurationThreshold: 3s
            waitDurationInOpenState: 60s
            slidingWindowSize: 10
            minimumNumberOfCalls: 5
    
    management:
      endpoints:
        web:
          exposure:
            include: health,prometheus,info
      metrics:
        export:
          prometheus:
            enabled: true
        distribution:
          percentiles-histogram:
            http.server.requests: true
            resilience4j.circuitbreaker.calls: true
        tags:
          application: ${spring.application.name}
          environment: staging
```

**3.2 Déploiement Rolling Update**

```bash
# Apply new ConfigMap
kubectl apply -f config/application-staging.yaml

# Update image version
kubectl set image deployment/connaissance-client-app \
  connaissance-client-app=registry.sqli.com/connaissance-client-app:2.0.0 \
  -n staging

# Monitor rollout
kubectl rollout status deployment/connaissance-client-app -n staging --timeout=5m

# Vérifier les pods
kubectl get pods -n staging -l app=connaissance-client-app
```

**3.3 Validation post-déploiement**

```bash
# Health check
curl https://staging.sqli.com/actuator/health

# Réponse attendue :
# {
#   "status": "UP",
#   "components": {
#     "apiIgnHealthIndicator": {
#       "status": "UP",
#       "details": {
#         "state": "CLOSED",
#         "failureRate": 0.0
#       }
#     }
#   }
# }

# Test du nouveau endpoint PUT
curl -X PUT https://staging.sqli.com/v1/connaissance-clients/{id} \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-$(uuidgen)" \
  -d '{
    "nom": "Test",
    "prenom": "Migration",
    "ligne1": "1 rue de Test",
    "codePostal": "33000",
    "ville": "Bordeaux",
    "situationFamiliale": "CELIBATAIRE",
    "nombreEnfants": 0
  }'

# Réponse attendue : HTTP 200 avec la fiche complète
```

### Étape 4 : Monitoring et observabilité

**4.1 Vérifier les métriques Prometheus**

```bash
# Métriques circuit breaker
curl https://staging.sqli.com/actuator/prometheus | grep resilience4j_circuitbreaker

# Métriques attendues :
# resilience4j_circuitbreaker_state{name="apiIgn"} 0.0  # CLOSED
# resilience4j_circuitbreaker_calls_total{name="apiIgn",kind="successful"} 123
# resilience4j_circuitbreaker_failure_rate{name="apiIgn"} 0.0
```

**4.2 Importer le dashboard Grafana**

```bash
# 1. Copier le fichier dashboard
scp docs/monitoring/grafana-modifier-client.json staging-grafana:/tmp/

# 2. Dans Grafana UI :
# - Dashboards > Import
# - Upload JSON file : /tmp/grafana-modifier-client.json
# - Select data source : Prometheus (staging)
# - Import

# 3. Vérifier les 9 panneaux :
# - Circuit breaker state
# - Failure rate
# - API calls breakdown
# - Latency p50/p95/p99
# - HTTP status distribution
# - Kafka events
# - MongoDB latency
# - JVM memory
# - Error rate
```

**4.3 Configurer les alertes Prometheus**

```bash
# 1. Copier les règles d'alerting
scp docs/monitoring/alerts.yml staging-prometheus:/etc/prometheus/rules/

# 2. Ajouter dans prometheus.yml
cat >> /etc/prometheus/prometheus.yml << EOF
rule_files:
  - "/etc/prometheus/rules/alerts.yml"
EOF

# 3. Recharger Prometheus
curl -X POST http://staging-prometheus:9090/-/reload

# 4. Vérifier les alertes actives
curl http://staging-prometheus:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.name | contains("ModifierClient"))'
```

### Étape 5 : Tests de charge et résilience

**5.1 Test de charge nominal (JMeter recommandé)**

```bash
# Scénario : 100 utilisateurs pendant 5 minutes
# Target : 10 req/sec soutenu
# Assertion : 
# - p95 latency < 2s
# - Error rate < 1%
# - Circuit breaker reste CLOSED

# Commande JMeter
jmeter -n -t tests/jmeter/modifier-client-load.jmx \
  -Jusers=100 \
  -Jduration=300 \
  -Jhost=staging.sqli.com \
  -l results/load-test-$(date +%Y%m%d-%H%M%S).jtl
```

**5.2 Test de résilience (circuit breaker)**

```bash
# Provoquer l'ouverture du circuit breaker avec des adresses invalides
for i in {1..10}; do
  curl -X PUT https://staging.sqli.com/v1/connaissance-clients/{id} \
    -H "Content-Type: application/json" \
    -d '{
      "nom": "Test",
      "prenom": "CircuitBreaker",
      "ligne1": "1 rue Invalid",
      "codePostal": "99999",
      "ville": "InvalidCity",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }'
done

# Vérifier l'état du circuit
curl https://staging.sqli.com/actuator/health | jq '.components.apiIgnHealthIndicator'

# Réponse attendue après 10 échecs :
# {
#   "status": "DOWN",
#   "details": {
#     "state": "OPEN",
#     "message": "API IGN est indisponible - Fallback actif"
#   }
# }

# Le circuit se ferme automatiquement après 60s (waitDurationInOpenState)
```

### Étape 6 : Déploiement en production

**6.1 Blue/Green deployment (recommandé)**

```bash
# 1. Déployer la version 2.0.0 dans le slot "green"
kubectl apply -f k8s/deployment-green-v2.yaml

# 2. Attendre que tous les pods soient READY
kubectl wait --for=condition=ready pod -l app=connaissance-client-app,version=2.0.0 -n production --timeout=5m

# 3. Smoke tests sur le slot green
curl https://green.production.sqli.com/actuator/health

# 4. Basculer le trafic (update service selector)
kubectl patch service connaissance-client-app -n production \
  -p '{"spec":{"selector":{"version":"2.0.0"}}}'

# 5. Monitor les logs et métriques pendant 15 minutes
kubectl logs -f -n production -l app=connaissance-client-app,version=2.0.0

# 6. Si OK : supprimer le slot blue (v1.0.0)
kubectl delete deployment connaissance-client-app-blue -n production
```

**6.2 Validation production**

```bash
# Health check production
curl https://production.sqli.com/actuator/health

# Métriques Prometheus
curl https://production.sqli.com/actuator/prometheus | grep resilience4j

# Test fonctionnel réel
curl -X PUT https://production.sqli.com/v1/connaissance-clients/{real-id} \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: prod-test-$(uuidgen)" \
  -d @test-data/real-client-update.json
```

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut | Requis |
|----------|-------------|-------------------|--------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/connaissance-client` | ✅ |
| `KAFKA_BOOTSTRAP_SERVERS` | Serveurs Kafka | `localhost:9092` | ✅ |
| `API_IGN_BASE_URL` | URL de l'API IGN | `https://api-adresse.data.gouv.fr` | ❌ |
| `ENVIRONMENT` | Environnement (local/staging/production) | `local` | ❌ |
| `JAVA_OPTS` | Options JVM | `-Xms512m -Xmx1024m` | ❌ |

### Configuration Resilience4j (circuit breaker)

**Environnement de staging/dev** (plus tolérant) :
```yaml
resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        failureRateThreshold: 50        # 50% d'échecs pour ouvrir
        slowCallRateThreshold: 70       # 70% d'appels lents
        slowCallDurationThreshold: 5s   # Appel lent si > 5s
        waitDurationInOpenState: 30s    # Rester ouvert 30s seulement
        slidingWindowSize: 5            # Fenêtre réduite
        minimumNumberOfCalls: 3         # Min 3 appels
```

**Environnement de production** (strict) :
```yaml
resilience4j:
  circuitbreaker:
    instances:
      apiIgn:
        failureRateThreshold: 30        # 30% d'échecs pour ouvrir
        slowCallRateThreshold: 50       # 50% d'appels lents
        slowCallDurationThreshold: 3s   # Appel lent si > 3s
        waitDurationInOpenState: 60s    # Rester ouvert 60s
        slidingWindowSize: 10           # Fenêtre glissante de 10 appels
        minimumNumberOfCalls: 5         # Min 5 appels avant calcul
```

---

## 🧪 Tests de Validation

### Suite de tests automatisée

```bash
# 1. Tests unitaires (rapides, sans dépendances)
mvn test

# 2. Tests d'intégration (nécessite MongoDB + Kafka)
mvn verify -Pintegration-tests

# 3. Tests BDD Karate
cd tests/connaissance-client-karate
mvn test

# 4. Tests de sécurité (OWASP)
mvn org.owasp:dependency-check-maven:check

# 5. Tests de performance (JMeter)
jmeter -n -t tests/jmeter/modifier-client-load.jmx -l results/perf-test.jtl
```

### Checklist de validation manuelle

- [ ] **Build** : `mvn clean package` réussit
- [ ] **Tests** : 13 tests passent (4 domain + 5 API + 4 integration)
- [ ] **Couverture** : JaCoCo > 85%
- [ ] **Health check** : `/actuator/health` retourne UP
- [ ] **Circuit breaker** : `apiIgnHealthIndicator` présent
- [ ] **Métriques** : `/actuator/prometheus` expose `resilience4j_*`
- [ ] **PUT endpoint** : `PUT /v1/connaissance-clients/{id}` retourne 200
- [ ] **Validation adresse** : HTTP 422 si code postal/ville invalide
- [ ] **404** : HTTP 404 si client inexistant
- [ ] **Événement Kafka** : Event publié si adresse change
- [ ] **No event** : Pas d'event si adresse identique
- [ ] **Correlation-id** : Header X-Correlation-ID propagé dans les logs
- [ ] **Dashboard Grafana** : Les 9 panneaux affichent des données
- [ ] **Alertes Prometheus** : 8 règles configurées

---

## ⏪ Rollback

### Rollback Kubernetes (Blue/Green)

**Si problème détecté < 1h après déploiement :**

```bash
# Revenir au slot blue (v1.0.0)
kubectl patch service connaissance-client-app -n production \
  -p '{"spec":{"selector":{"version":"1.0.0"}}}'

# Vérifier le trafic
kubectl logs -f -n production -l app=connaissance-client-app,version=1.0.0

# Le trafic revient instantanément sur v1.0.0
# Aucune perte de données (MongoDB reste compatible)
```

**Temps de rollback estimé** : < 30 secondes

### Rollback MongoDB (si corruption de données)

```bash
# Restore depuis le backup
mongorestore --uri="mongodb://localhost:27017" \
  --db=connaissance-client \
  --collection=clients \
  /backup/20251122-050000/connaissance-client/clients.bson

# Vérifier les données
mongo connaissance-client --eval "db.clients.count()"
```

### Rollback configuration

**Supprimer la configuration Resilience4j** (si problème circuit breaker) :

```yaml
# Retirer de application.yml
# resilience4j:
#   circuitbreaker: ...

# Redémarrer l'application
kubectl rollout restart deployment/connaissance-client-app -n production
```

---

## 🔧 Troubleshooting

### Problème 1 : Circuit breaker toujours OPEN

**Symptômes :**
- Health check : `apiIgnHealthIndicator.status = DOWN`
- État circuit : `OPEN`
- Logs : "Circuit breaker activated for API IGN validation"

**Causes possibles :**
1. API IGN réellement indisponible
2. Firewall bloque les requêtes sortantes HTTPS
3. Seuils circuit breaker trop stricts

**Diagnostic :**
```bash
# Tester l'accès direct à l'API IGN
curl https://api-adresse.data.gouv.fr/search/codes-postaux/33000

# Vérifier les logs applicatifs
kubectl logs -n production -l app=connaissance-client-app | grep "circuit breaker"

# Vérifier les métriques circuit breaker
curl https://production.sqli.com/actuator/prometheus | grep resilience4j_circuitbreaker_failure_rate
```

**Solutions :**
```bash
# Solution 1 : Augmenter les seuils temporairement
# Éditer ConfigMap : failureRateThreshold: 70

# Solution 2 : Forcer la fermeture du circuit (DANGER : ne pas faire en prod)
# Redémarrer l'application
kubectl rollout restart deployment/connaissance-client-app

# Solution 3 : Mode dégradé (acceptable)
# Le circuit ouvert est un comportement normal en cas d'indisponibilité API IGN
# L'application continue de fonctionner sans validation externe (fallback)
```

### Problème 2 : Latence élevée (> 2s)

**Symptômes :**
- Dashboard Grafana : p95 latency > 2s
- Logs : Appels API IGN > 3s

**Causes possibles :**
1. API IGN surchargée
2. Réseau lent
3. MongoDB lent

**Diagnostic :**
```bash
# Mesurer latence API IGN
time curl https://api-adresse.data.gouv.fr/search/codes-postaux/33000

# Mesurer latence MongoDB
kubectl exec -it mongodb-pod -- mongo --eval "db.runCommand({ping: 1})"

# Vérifier les métriques MongoDB
curl https://production.sqli.com/actuator/prometheus | grep mongodb
```

**Solutions :**
```bash
# Solution 1 : Augmenter les timeouts
# application.yml:
# resilience4j.circuitbreaker.instances.apiIgn.slowCallDurationThreshold: 5s

# Solution 2 : Activer le cache API IGN (TODO : implémenter cache Redis)
# Solution 3 : Optimiser les requêtes MongoDB (index, projection)
```

### Problème 3 : Événements Kafka non publiés

**Symptômes :**
- Modification d'adresse réussie (HTTP 200)
- Mais aucun événement Kafka dans le topic `client-adresse-changee`

**Diagnostic :**
```bash
# Vérifier la connexion Kafka
kubectl logs -n production -l app=connaissance-client-app | grep -i kafka

# Vérifier le topic Kafka
kubectl exec -it kafka-pod -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic client-adresse-changee \
  --from-beginning

# Vérifier les métriques Kafka
curl https://production.sqli.com/actuator/prometheus | grep kafka
```

**Solutions :**
```bash
# Solution 1 : Vérifier KAFKA_BOOTSTRAP_SERVERS
kubectl get configmap connaissance-client-config -o yaml | grep KAFKA

# Solution 2 : Vérifier les permissions Kafka
# Solution 3 : Redémarrer les pods Kafka
kubectl rollout restart statefulset/kafka -n production
```

### Problème 4 : Build failure

**Symptômes :**
- `mvn clean package` échoue
- Erreur : "Non-parseable POM"

**Solution :**
```bash
# Vérifier le pom.xml
xmllint --noout pom.xml

# Si erreur : corriger le XML et relancer
mvn clean package -DskipTests
```

---

## 📞 Support

- **Documentation** : `/docs/README.md`
- **CHANGELOG** : `/CHANGELOG.md`
- **Logs** : `kubectl logs -n production -l app=connaissance-client-app`
- **Monitoring** : Grafana dashboard "Modifier Client"
- **Contact** : pbousquet@sqli.com

---

**Fin du guide de migration**
