<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles: all placeholders replaced by project-specific rules
- Added sections: Architecture, Conception, Développement, Stack, Sécurité, Patterns, Containerisation, Documentation
- Removed sections: none
- Templates requiring updates: plan-template.md ✅, spec-template.md ✅, tasks-template.md ✅
- Follow-up TODOs: RATIFICATION_DATE (à renseigner si date d'adoption officielle)
-->

# Constitution d'Architecture - Connaissance Client

## Core Principles

### I. Architecture Hexagonale (Ports & Adapters)
Le projet implémente strictement l'architecture hexagonale :
- Séparation des couches (domaine, adaptateurs entrants/sortants, app)
- Inversion de dépendances : toutes les dépendances pointent vers le domaine
- Ports définis dans le domaine, jamais d'implémentations connues

### II. Domain-Driven Design (DDD)
- Modèle riche du domaine, Value Objects immuables, entité racine Client
- Langage ubiquitaire, exceptions métier explicites
- Règles métier dans le domaine, validation via services externes

### III. Modularité Maven Multi-modules
- Structure modulaire stricte, dépendances contrôlées
- Le domaine ne dépend de personne, tous les adaptateurs dépendent du domaine
- L'app agrège tous les modules

### IV. Immutabilité et Value Objects
- Utilisation systématique des records Java 17+
- Immutabilité, thread-safety, validation déclarative

### V. Séparation des Modèles
- 3 modèles : domaine, DB, DTO
- Mappers dédiés, aucune annotation technique dans le domaine

### VI. API-First & Event-Driven
- Spécification OpenAPI 3.0 et AsyncAPI 3.0 contract-first
- Génération automatique des contrôleurs, DTOs, producers/consumers
- Publication d'événements après modification d'adresse

### VII. Test-Driven Development (TDD)
- Couverture de tests à 3 niveaux : domaine, adaptateurs, intégration
- Convention Given-When-Then systématique

### VIII. Gestion des Exceptions Métier
- Exceptions checked pour validation et erreurs métier
- Conversion en HTTP status dans l'API

### IX. Injection de Dépendances & Configuration
- Wiring centralisé dans le module app
- Configuration externalisée, support de profils Spring

### X. Génération de Code
- OpenAPI Generator, ZenWave SDK, MapStruct
- Contract-first, cohérence garantie entre spec et code

## Contraintes Techniques et Stack

- Java 21, Spring Boot 3.5.0, Spring Data MongoDB, Spring Cloud Stream, Maven 3.x
- Lombok (hors Value Objects), MapStruct, OpenAPI Generator, ZenWave SDK, JUnit 5, Mockito, Karate
- JaCoCo, Maven Failsafe, Spring Actuator, Micrometer Prometheus, OWASP Dependency Check
- Sécurité : Spring Security, OAuth2, JWT, Keycloak

## Patterns, Conventions et Containerisation

- Naming conventions : packages, classes, services, mappers, DTOs, tests
- Patterns : Repository, Service, Mapper (MapStruct)
- Docker : base image azul/zulu-openjdk:17-jdk-crac-latest, support CRaC
- Kubernetes : manifests dans k8s/
- Build natif : GraalVM Native Image, Spring AOT

## Documentation et Workflow

- Documentation architecture : AsciiDoc, diagrammes C4, hexagonale
- Documentation API : Swagger UI, OpenAPI 3.0
- README.adoc : instructions build/run
- Workflow : TDD, contract-first, configuration externalisée

## Governance
La présente constitution prévaut sur toute autre pratique ou documentation technique. Toute modification doit être documentée, approuvée et accompagnée d'un plan de migration si impactant. La conformité aux principes est vérifiée à chaque revue de code et lors de la livraison. Les amendements majeurs requièrent consensus d'équipe et mise à jour de la version.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): date d'adoption officielle à renseigner | **Last Amended**: 2025-11-21
