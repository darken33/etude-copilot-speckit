# Fonctionnalités Référencées - Connaissance Client

<!--
Sync Impact Report
- Source: specs/features-specification.md
- Version: 2.0.0
- Toutes les fonctionnalités métier et techniques sont documentées et considérées comme implémentées.
- Ce fichier sert de référence pour speckit.specify : toute nouvelle spécification doit être compatible avec ces fonctionnalités existantes.
- Les évolutions futures (section 9) sont à considérer comme backlog, non encore implémentées.
-->

## Fonctionnalités Métier Implémentées

- Création d'un nouveau client (nouveauClient)
- Consultation de tous les clients (listerClients)
- Consultation d'un client spécifique (informationsClient)
- Changement d'adresse (changementAdresse)
- Changement de situation familiale (changementSituation)
- Suppression d'un client (supprimerClient)

## Fonctionnalités Techniques Implémentées

- Validation des adresses via API Carto IGN
- Validation Bean Validation (JSR-303)
- Publication d'événements Kafka (changement d'adresse)
- Authentification JWT (OAuth2, Keycloak)
- Health checks et métriques Prometheus

## Modèle de Données

- Entité racine : Client (UUID, Nom, Prénom, Adresse, SituationFamiliale, nombreEnfants)
- Value Objects : Adresse, Nom, Prénom, CodePostal, Ville, LigneAdresse, Destinataire
- Enum : SituationFamiliale (CELIBATAIRE, MARIE)
- Modèle DB : ClientDb (MongoDB, structure plate)
- Modèle API : DTOs générés OpenAPI

## Règles de Validation

- Structurelle : format, taille, contraintes sur tous les champs
- Métier : cohérence code postal/ville, unicité client, existence client
- Sécurité : JWT requis, audit trail suppression

## Tests et Qualité

- Couverture >80% (JaCoCo)
- Tests unitaires, intégration, BDD/API (Karate)
- Scénarios de tests pour chaque fonctionnalité

## Dépendances Externes

- API Carto IGN (validation)
- Keycloak (authentification)
- MongoDB (persistance)
- Kafka (événements)

## Glossaire et Backlog

- Glossaire métier et technique inclus
- Backlog évolutions futures : historique adresses, recherche multi-critères, pagination, export, import, fusion doublons, consentements RGPD, etc.

**Version**: 2.0.0 | **Source**: specs/features-specification.md | **Date**: 2025-11-21
