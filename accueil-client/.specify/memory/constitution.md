# Accueil Client - Constitution du Projet

<!--
Sync Impact Report:
- Version: 0.0.0 → 1.0.0 (Initial constitution creation)
- Principles defined: 5 core architecture principles
- Added section: Architecture Principles covering React components, API contracts, code quality
- Templates requiring updates: ✅ All compliant (no template dependencies yet)
- Ratification: 2025-11-27
-->

## Principes Fondamentaux

### I. Séparation Logique Métier / Présentation (NON-NÉGOCIABLE)

**Règle**: Les composants React doivent séparer au maximum la logique métier du code de présentation (template HTML/JSX).

**Application pratique**:
- **Logique métier** : extraction dans des hooks personnalisés (`use*.ts`), services (`src/services/`), ou utilitaires (`src/utils/`)
- **Présentation** : JSX minimal, focus sur l'affichage et la structure DOM
- **Idéalement** : fichiers séparés quand la complexité le justifie
  - `ComponentName.tsx` → présentation uniquement
  - `useComponentName.ts` → logique métier, state management, effets de bord
  - `ComponentName.service.ts` → appels API, transformations de données

**Justification**: 
- Améliore la testabilité (logique métier testable sans DOM)
- Facilite la maintenance et la réutilisation du code
- Rend le code de présentation plus lisible et compréhensible
- Permet la parallélisation du développement (UI/logique)

**Exemple conforme**:
```typescript
// ❌ Mauvais : tout dans le composant
function ClientForm() {
  const [data, setData] = useState({});
  const handleSubmit = async () => { /* logique complexe */ };
  return <form>...</form>;
}

// ✅ Bon : séparation claire
function ClientForm() {
  const { data, handleSubmit, errors } = useClientForm();
  return <form>...</form>;
}
```

### II. Contrat OpenAPI comme Source de Vérité

**Règle**: L'interface OpenAPI (`spec/connaissance-client-api.yaml`) définit le contrat d'API et DOIT être respecté strictement.

**Application pratique**:
- Types TypeScript générés/synchronisés avec le contrat OpenAPI
- Validation côté client alignée sur les contraintes OpenAPI (regex, min/max, enum)
- Versioning sémantique du contrat : MAJOR pour breaking changes
- Backend mock (`server.js`) conforme à 100% au contrat

**Justification**:
- Évite les divergences frontend/backend
- Documentation à jour et contractuelle
- Facilite l'intégration et la génération automatique de code

### III. Validation Multi-Niveaux

**Règle**: Validation en couches pour garantir l'intégrité des données.

**Application pratique**:
- **Niveau 1 - Client** : React Hook Form avec règles de validation TypeScript
- **Niveau 2 - Utilitaire** : `src/utils/validation.ts` pour logique métier complexe
- **Niveau 3 - Backend** : Validation serveur (même en mode mock) selon OpenAPI spec
- Feedback utilisateur clair et actionnable sur chaque erreur

**Justification**:
- Expérience utilisateur optimale (feedback immédiat)
- Sécurité renforcée (pas de confiance aveugle au client)
- Cohérence avec les règles métier

### IV. Tests Unitaires Obligatoires

**Règle**: Toute logique métier, utilitaire ou service DOIT avoir une couverture de tests unitaires.

**Application pratique**:
- Tests Jest + React Testing Library pour les composants
- Tests des utilitaires (`validation.test.ts`) avec cas limites
- Tests des services API (mocking axios)
- Minimum 80% de couverture pour la logique métier
- Tests exécutés en CI avant tout merge

**Justification**:
- Détection précoce des régressions
- Documentation vivante du comportement attendu
- Facilite le refactoring en toute confiance

### V. Typage Fort et Stricte

**Règle**: TypeScript en mode strict, typage explicite requis.

**Application pratique**:
- `strict: true` dans `tsconfig.json`
- Pas de `any` sauf justification explicite commentée
- Types d'interface basés sur le contrat OpenAPI (`src/types/api.ts`)
- Enums TypeScript pour valeurs fermées (ex: `SituationFamiliale`)

**Justification**:
- Détection d'erreurs à la compilation
- Meilleure autocomplétion et refactoring
- Documentation implicite du code

## Contraintes Techniques

### Stack Technologique

**Frontend**:
- React 18 avec TypeScript 4.9+
- React Hook Form pour gestion de formulaires
- Axios pour requêtes HTTP
- CSS Modules pour isolation des styles
- Jest + React Testing Library pour tests

**Backend Mock**:
- Node.js avec Express
- Persistence fichier JSON (`db.json`)
- Validation des données selon OpenAPI

### Structure de Projet Standardisée

```
src/
├── components/         # Composants React (présentation)
│   ├── ComponentName.tsx
│   └── ComponentName.css
├── hooks/             # Custom hooks (logique métier extraite)
│   └── useComponentName.ts
├── services/          # Couche API et logique métier
│   └── api.ts
├── types/             # Types TypeScript (contrat OpenAPI)
│   └── api.ts
├── utils/             # Utilitaires purs (validation, formatage)
│   └── validation.ts
└── __tests__/         # Tests unitaires
    └── validation.test.ts
```

### Qualité de Code

- Linting avec ESLint (règles React + TypeScript)
- SonarQube pour analyse statique
- Pas de `console.log` en production (utiliser logger approprié)
- Commentaires JSDoc pour fonctions publiques complexes

## Processus de Développement

### Workflow Git

1. **Feature branch** depuis `main` : `feature/description-courte`
2. **Commits atomiques** avec messages descriptifs (convention Conventional Commits recommandée)
3. **Tests passants** obligatoires avant push
4. **Code review** requis avant merge

### Gestion des Changements de Contrat API

1. Mettre à jour `spec/connaissance-client-api.yaml`
2. Incrémenter la version selon versioning sémantique
3. Synchroniser `src/types/api.ts` avec le nouveau contrat
4. Mettre à jour le backend mock (`server.js`, `db.json`)
5. Adapter les composants et services impactés
6. Mettre à jour les tests unitaires
7. Mettre à jour la documentation (README, OVERVIEW, BACKEND_MOCK)

### Revue de Code - Checklist

- [ ] Séparation logique métier / présentation respectée ?
- [ ] Types TypeScript stricts et explicites ?
- [ ] Tests unitaires ajoutés/mis à jour ?
- [ ] Validation multi-niveaux implémentée ?
- [ ] Contrat OpenAPI respecté ?
- [ ] Documentation mise à jour si nécessaire ?
- [ ] Pas de régression sur les fonctionnalités existantes ?

## Gouvernance

### Autorité de la Constitution

Cette constitution **prime sur toutes les autres pratiques** du projet. En cas de conflit entre cette constitution et d'autres documents (README, wiki, commentaires), **la constitution prévaut**.

### Processus d'Amendement

1. **Proposition** : documenter la raison, l'impact et les bénéfices
2. **Discussion** : validation avec l'équipe (minimum 1 tech lead)
3. **Migration** : plan de migration pour code existant non-conforme
4. **Versioning** : incrémenter MAJOR/MINOR/PATCH selon impact
5. **Communication** : annoncer changement à toute l'équipe

### Compliance et Exceptions

- Toute PR doit être validée selon les principes ci-dessus
- Exceptions possibles uniquement avec justification écrite et approbation tech lead
- Complexité technique doit être justifiée (pas de sur-engineering)

### Audit de Conformité

Vérifications périodiques recommandées :
- Structure de fichiers respectée
- Taux de couverture de tests > 80%
- Typage strict sans `any` injustifiés
- Séparation logique/présentation dans les nouveaux composants

**Version**: 1.0.0 | **Ratified**: 2025-11-27 | **Last Amended**: 2025-11-27
