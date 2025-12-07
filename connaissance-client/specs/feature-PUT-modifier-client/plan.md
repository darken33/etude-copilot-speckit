# Plan d'Implémentation : Modification Globale du Client (PUT)

> Plan technique structuré pour l'implémentation du endpoint PUT /v1/connaissance-clients/{id} en conformité avec l'architecture hexagonale DDD du projet

**Version**: 1.0.0  
**Date**: 2025-11-21  
**Spec source**: `specs/feature-PUT-modifier-client.md`

---

## 1. CONSTITUTION CHECK

### ✅ Principes Architecturaux Respectés

| Principe | Conformité | Justification |
|----------|------------|---------------|
| **Architecture Hexagonale** | ✅ | Use case dans le domaine (`modifierClient`), adaptateur API (delegate), inversion dépendances |
| **Domain-Driven Design** | ✅ | Langage ubiquitaire, Value Objects immuables, exceptions métier explicites |
| **Modularité Maven** | ✅ | Modifications dans `connaissance-client-domain` et `connaissance-client-api` uniquement |
| **Immutabilité** | ✅ | Utilisation des records existants (Nom, Prenom, Adresse, etc.) |
| **Séparation des Modèles** | ✅ | DTO (OpenAPI), Domaine (Client), DB (ClientDb) avec mappers dédiés |
| **API-First** | ✅ | Extension de `connaissance-client-api.yaml` (OpenAPI 3.0) |
| **Event-Driven** | ✅ | Publication Kafka si adresse change (cohérent avec existant) |
| **Test-Driven Development** | ✅ | Tests unitaires (Given-When-Then) et BDD Karate prévus |
| **Exceptions Métier** | ✅ | `ClientInconnuException`, `AdresseInvalideException` (existantes) |
| **Injection de Dépendances** | ✅ | Wiring dans module app, pas de modifications de config nécessaires |

### 🚧 Points d'Attention

1. **Circuit Breaker API IGN** : Nécessite ajout dépendance Resilience4j (non présente actuellement)
2. **Audit Trail MDC** : Configuration Logback requise pour MDC (user, correlation-id)
3. **Concurrence Last-Write-Wins** : Comportement par défaut MongoDB, pas de modification nécessaire

---

## 2. TECHNICAL CONTEXT

### 2.1 Modules Impactés

```
connaissance-client/
├── connaissance-client-domain/          ← Service métier + interface
│   └── src/main/java/.../domain/
│       ├── ConnaissanceClientService.java      (interface étendue)
│       └── ConnaissanceClientServiceImpl.java  (implémentation)
├── connaissance-client-api/             ← API REST + DTOs
│   ├── src/main/resources/
│   │   └── connaissance-client-api.yaml        (spec OpenAPI étendue)
│   └── src/main/java/.../api/
│       └── ConnaissanceClientDelegate.java     (delegate implémenté)
└── connaissance-client-cp-adapter/      ← Circuit Breaker API IGN
    └── src/main/java/.../ports/
        └── CodePostauxServiceImpl.java         (ajout circuit breaker)
```

### 2.2 Stack Technique

| Composant | Technologie | Version | Usage |
|-----------|-------------|---------|-------|
| **Backend** | Java | 21 | Langage principal |
| **Framework** | Spring Boot | 3.5.0 | Orchestration |
| **Build** | Maven | 3.x | Gestion dépendances |
| **API Spec** | OpenAPI Generator | 7.3.0 | Génération DTO/API |
| **Validation** | Bean Validation | 3.0 | Validation DTO |
| **Logging** | SLF4J + Logback | - | Audit trail structuré |
| **Resilience** | Resilience4j | 2.2.0 | Circuit breaker |
| **Database** | MongoDB | 4.x | Persistence |
| **Messaging** | Kafka | - | Event publication |
| **Testing** | JUnit 5 + Mockito | - | Tests unitaires |
| **BDD** | Karate | - | Tests API |

---

## 3. IMPLEMENTATION SUMMARY

### ✅ Déjà Implémenté

1. **OpenAPI Spec** : Endpoint PUT défini dans `connaissance-client-api.yaml`
2. **Code Generation** : DTOs et interfaces générés via OpenAPI Generator
3. **Domain Interface** : Méthode `modifierClient` ajoutée à `ConnaissanceClientService`
4. **Domain Service** : Logique métier implémentée dans `ConnaissanceClientServiceImpl`
5. **API Delegate** : Mapping DTO ↔ Domaine et gestion erreurs HTTP
6. **Compilation** : Tous les modules compilent avec succès (domain + API)

### 🚧 Reste à Implémenter

1. **Circuit Breaker** : Ajouter Resilience4j sur `CodePostauxServiceImpl`
2. **Audit Trail MDC** : Enrichir logs avec userId, correlationId, clientId, operation
3. **HTTP 422** : Gérer explicitement `AdresseInvalideException` → 422 Unprocessable Entity
4. **Tests Unitaires** : 
   - Domain : Tests modifierClient (success, not found, invalid address, no event)
   - API : Tests delegate (200, 404, 422, 400)
5. **Tests Intégration** : Tests avec MongoDB réelle
6. **Tests BDD** : Features Karate pour contrat API
7. **Observability** : 
   - Métriques Prometheus circuit breaker
   - Health check custom
   - Dashboards Grafana/SigNoz

---

## 4. PHASE-BY-PHASE ROADMAP

### Phase 0: Design & Contracts ✅ COMPLETE
- ✅ OpenAPI spec étendue
- ✅ Code generation (DTOs, interfaces)
- ✅ Validation compilation

### Phase 1: Domain Implementation 🟡 PARTIAL
- ✅ Interface service étendue
- ✅ Service domaine implémenté
- ⏳ Circuit breaker API IGN
- ⏳ Audit trail MDC enrichi
- ⏳ Tests unitaires domaine

### Phase 2: API Layer Implementation 🟡 PARTIAL
- ✅ Delegate API implémenté
- ⏳ Gestion HTTP 422
- ⏳ MDC correlation-id
- ⏳ Tests unitaires delegate

### Phase 3: Integration & E2E Testing ⏳ TODO
- ⏳ Tests intégration MongoDB
- ⏳ Tests BDD Karate
- ⏳ Validation end-to-end

### Phase 4: Observability & Monitoring ⏳ TODO
- ⏳ Métriques Prometheus
- ⏳ Health check custom
- ⏳ Dashboards & alertes

---

## 5. KEY DECISIONS FROM CLARIFICATIONS

Décisions issues de la session de clarification (2025-11-21) :

| Question | Décision | Impact |
|----------|----------|--------|
| **Rate limiting scope** | Pas de rate limiting (RS-004 supprimée) | Simplifie architecture, pas de Redis requis |
| **Gestion concurrence** | Last-write-wins sans contrôle (RG-006) | Pas de version field, comportement MongoDB par défaut |
| **Fallback API IGN** | Circuit breaker (3 fails → skip 60s) | Nécessite Resilience4j, mode dégradé documenté |
| **Audit trail** | Logger structuré SLF4J+Logback avec MDC | Configuration Logback requise, logs dans fichiers rotatifs |
| **Notification utilisateur** | Pas de notification backend (RG-008) | Réponse HTTP 200 suffit, front-end gère UI feedback |

---

## 6. RISKS & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **API IGN indisponible** | Moyenne | Élevé | Circuit breaker avec fallback (skip validation) |
| **Modifications concurrentes** | Faible | Moyen | Last-write-wins accepté (documenté RG-006) |
| **Performance dégradée** | Faible | Moyen | Timeout 3s + circuit breaker, monitoring actif |
| **Perte audit trail** | Très faible | Critique | Logs persistés dans fichiers rotatifs + backup |
| **Régression fonctionnelle** | Faible | Élevé | Suite de tests complète (unitaire + intégration + BDD) |

---

## 7. SUCCESS CRITERIA

### Critères Techniques

- ✅ Tous les tests passent (unitaires, intégration, BDD)
- ✅ Couverture code > 80% (JaCoCo)
- ✅ Aucune CVE critique (OWASP)
- ✅ Temps réponse P95 < 2s (avec validation API IGN)
- ✅ Circuit breaker fonctionne (fallback testé)
- ✅ Audit logs structurés avec MDC complet

### Critères Fonctionnels

- ✅ Modification globale client fonctionne (tous champs)
- ✅ Validation adresse via API IGN active
- ✅ Événement Kafka publié si adresse change
- ✅ Pas d'événement si adresse inchangée
- ✅ Gestion erreurs HTTP correcte (404, 400, 422)

### Critères Non-Fonctionnels

- ✅ Conformité architecture hexagonale DDD
- ✅ Immutabilité domaine préservée
- ✅ Pas de régression sur endpoints existants
- ✅ Documentation OpenAPI à jour
- ✅ Métriques Prometheus exportées

---

## 8. ROLLOUT STRATEGY

### Pre-Deployment Checklist

- [ ] Tous les tests unitaires passent (domain + API)
- [ ] Tests d'intégration OK
- [ ] Tests BDD Karate OK
- [ ] Couverture JaCoCo > 80%
- [ ] OWASP Dependency Check sans CVE critiques
- [ ] Revue de code effectuée
- [ ] Documentation mise à jour (README, OpenAPI)

### Déploiement Progressif

1. **Staging** : Smoke tests, validation circuit breaker, test fallback
2. **Canary Release (10%)** : 1 pod, 10% trafic, monitoring métriques
3. **Production (100%)** : Rollout complète si canary OK

### Post-Deployment Monitoring

**Première heure :**
- Métriques Prometheus : `api_ign_validation_attempts_total`, `api_ign_circuit_breaker_fallback_total`
- Logs audit : taux erreur, latence P95/P99
- Alertes Grafana : circuit breaker ouvert > 5 min

**Première semaine :**
- Analyse quotidienne des logs audit
- Revue des fallbacks circuit breaker
- Ajustement seuils si nécessaire

---

## 9. NEXT STEPS

1. **Break down into tasks** : Utiliser `/speckit.tasks` pour décomposer en tâches atomiques
2. **Implement Phase 1** : Terminer circuit breaker, MDC, tests unitaires
3. **Implement Phase 2** : HTTP 422, tests delegate
4. **Implement Phase 3** : Tests intégration + BDD
5. **Implement Phase 4** : Observability complète
6. **Deploy** : Suivre rollout strategy

---

**Document généré le** : 2025-11-21  
**Auteur** : GitHub Copilot (Claude Sonnet 4.5)  
**Basé sur** : `specs/feature-PUT-modifier-client.md` + Constitution d'Architecture + Session clarification
