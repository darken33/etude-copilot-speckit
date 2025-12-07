# Nouvelle Fonctionnalité à Implémenter : Modification Globale du Client (PUT)

<!--
Sync Impact Report
- Source: specs/feature-PUT-modifier-client.md
- Statut: À implémenter (non présente dans la liste des fonctionnalités existantes)
- Cette fonctionnalité doit être intégrée dans le workflow speckit comme nouvelle spec à planifier et développer.
-->

## Résumé

- Endpoint : `PUT /v1/connaissance-clients/{id}`
- Use case métier : `modifierClient(UUID id, Client clientModifie)`
- Mise à jour atomique de toutes les données d'une fiche client
- Validation multi-niveaux (DTO, métier, externe)
- Sécurité renforcée (JWT, rôle, rate limiting)
- Publication d'événement Kafka si adresse modifiée
- Audit trail obligatoire

## Points d'intégration workflow speckit

- À planifier dans le backlog des specs à implémenter
- À synchroniser avec la constitution et les fonctionnalités existantes
- À vérifier pour compatibilité DDD, hexagonale, validation, sécurité
- À documenter dans le plan, spec, tasks et checklist

**Source**: specs/feature-PUT-modifier-client.md | **Date**: 2025-11-21
