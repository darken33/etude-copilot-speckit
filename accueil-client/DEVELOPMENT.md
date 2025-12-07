# Guide de Développement - Application Gestion Client SQLI

## 🎯 Vue d'ensemble

Cette application frontend React/TypeScript permet de gérer la connaissance client pour SQLI. Elle communique avec une API backend RESTful documentée via OpenAPI 3.0.

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: React 18 + TypeScript
- **State Management**: React Hooks (useState, useEffect)
- **Forms**: React Hook Form avec validation
- **HTTP Client**: Axios
- **Routing**: React Router Dom
- **Styling**: CSS Modules + Responsive Design
- **Build Tool**: Create React App (Webpack + Babel)

### Principes de Design
- **Mobile First**: Design responsive adaptatif
- **Accessibility**: Conformité WCAG 2.1 AA
- **Performance**: Lazy loading et optimisations
- **UX**: Interface intuitive et feedback utilisateur
- **Validation**: Double validation (client + serveur)

## 📁 Structure du Code

```
src/
├── components/              # Composants UI réutilisables
│   ├── ClientList.tsx       # Liste avec recherche et actions
│   ├── ClientList.css       # Styles du composant liste
│   ├── ClientForm.tsx       # Formulaire création/édition
│   └── ClientForm.css       # Styles du formulaire
├── services/               # Couche service et logique métier
│   └── api.ts              # Client API REST avec intercepteurs
├── types/                  # Définitions TypeScript
│   └── api.ts              # Types générés depuis OpenAPI spec
├── utils/                  # Fonctions utilitaires
│   └── validation.ts       # Validation métier et formatage
├── __tests__/              # Tests unitaires
│   └── validation.test.ts  # Tests des utilitaires
├── App.tsx                 # Composant racine et routing
├── App.css                 # Styles globaux application
├── index.tsx               # Point d'entrée React
└── index.css               # Reset CSS et styles de base
```

## 🔧 Configuration du Développement

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd accueil-client

# Installer les dépendances
npm install

# Configurer l'environnement local
cp .env.development .env.local
# Modifier REACT_APP_API_BASE_URL si nécessaire
```

### Scripts disponibles
```bash
# Développement avec hot reload
npm start

# Build de production
npm run build

# Tests unitaires
npm test

# Tests avec couverture
npm test -- --coverage --watchAll=false

# Linting et formatage
npm run lint
npm run lint:fix
npm run format
```

## 🎨 Standards de Code

### TypeScript
- Types stricts activés
- Interfaces préférées aux types
- Pas d'utilisation d'`any`
- Props typées pour tous les composants

### React
- Composants fonctionnels uniquement
- Hooks personnalisés pour la logique réutilisable
- Memorisation avec useMemo/useCallback si nécessaire
- Gestion d'état locale avec useState

### CSS
- Approche mobile-first
- CSS Modules pour l'isolation
- Variables CSS pour la consistance
- Flexbox/Grid pour les layouts

### Validation
```typescript
// Exemple de validation robuste
const validateClient = (client: Partial<ConnaissanceClientIn>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validation du nom avec regex et longueur
  if (!client.nom || client.nom.length < 2 || client.nom.length > 50) {
    errors.push({
      field: 'nom',
      message: 'Le nom doit contenir entre 2 et 50 caractères'
    });
  } else if (!/^[a-zA-Z ,.'-]+$/.test(client.nom)) {
    errors.push({
      field: 'nom',
      message: 'Le nom ne peut contenir que des lettres et certains caractères spéciaux'
    });
  }
  
  return errors;
};
```

## 🔄 Flux de Données

### Architecture des Composants
```
App (État global et routing)
├── ClientList (Affichage + recherche)
│   ├── États: clients[], loading, error, searchTerm
│   ├── Actions: fetchClients, deleteClient, filterClients
│   └── Events: onClientSelect, onNewClient
└── ClientForm (Création/édition)
    ├── États: formData, loading, errors, validationErrors
    ├── Actions: saveClient, updateAddress, updateSituation
    └── Events: onSave, onCancel
```

### Gestion des API Calls
```typescript
// Service API avec intercepteurs
class ConnaissanceClientAPI {
  // Gestion d'erreurs centralisée
  static handleError(error: any): Error {
    if (error.response?.data) {
      const apiError: ApiErrorResponse = error.response.data;
      return new Error(apiError.message || apiError.error);
    }
    return new Error('Une erreur inattendue est survenue');
  }
}
```

## 🎯 Fonctionnalités Clés

### 1. Liste des Clients
- **Affichage**: Grid responsive avec cards
- **Recherche**: Filtrage en temps réel (nom, prénom, ville)
- **Actions**: Sélection, suppression avec confirmation
- **Pagination**: Prévu pour de gros volumes

### 2. Formulaire Client
- **Modes**: Création et modification
- **Validation**: Temps réel + soumission
- **Sections**: Informations personnelles, adresse, situation
- **Updates**: Mise à jour partielle (adresse/situation)

### 3. Gestion d'État
- **Local State**: useState pour les composants
- **API State**: Loading, erreurs, données
- **Form State**: React Hook Form avec validation

### 4. UX/UI Features
- **Responsive**: Adaptation mobile/tablet/desktop
- **Accessibility**: Labels, focus management, ARIA
- **Performance**: Optimisations rendering
- **Feedback**: Messages d'erreur contextuels

## 🔐 Sécurité

### Validation
- **Client-side**: Validation immédiate pour UX
- **Server-side**: Validation finale pour sécurité
- **Sanitisation**: Nettoyage des entrées utilisateur
- **XSS Protection**: Échappement automatique React

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First approach */
.component {
  /* Mobile styles by default */
}

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1200px) {
  /* Desktop styles */
}
```

### Adaptations clés
- **Navigation**: Menu hamburger sur mobile
- **Grids**: 1 colonne mobile → multi-colonnes desktop
- **Forms**: Stack vertical mobile → layout horizontal
- **Cards**: Adaptation taille et espacement

## 🧪 Tests

### Types de Tests
```typescript
// Tests unitaires - Utilitaires
describe('validateClient', () => {
  it('should validate correct client data', () => {
    const validClient = { /* valid data */ };
    const errors = validateClient(validClient);
    expect(errors).toHaveLength(0);
  });
});

// Tests d'intégration - Composants
describe('ClientForm', () => {
  it('should submit form with valid data', async () => {
    render(<ClientForm onSave={mockSave} onCancel={mockCancel} />);
    // Test interactions
  });
});

// Tests E2E - User flows
describe('Client Management Flow', () => {
  it('should create, edit and delete client', () => {
    // Test complet du workflow
  });
});
```

### Couverture de Tests
- **Utilitaires**: 100% (validation, formatage)
- **Services**: 90% (API calls, error handling)
- **Composants**: 80% (rendering, user interactions)
- **Intégration**: 70% (workflows principaux)

## 🚀 Déploiement

### Build de Production
```bash
# Build optimisé
npm run build

# Vérification bundle size
npm run analyze

# Test build local
npx serve -s build
```

### Variables d'Environnement
```bash
# Development
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_DEBUG=true

# Production
REACT_APP_API_BASE_URL=https://api.sqli.com
REACT_APP_DEBUG=false
```

### Optimisations
- **Code splitting**: Lazy loading routes
- **Bundle optimization**: Tree shaking
- **Asset optimization**: Images, fonts
- **Caching**: Service worker pour assets

## 📊 Monitoring & Analytics

### Métriques de Performance
- **FCP**: First Contentful Paint < 2s
- **LCP**: Largest Contentful Paint < 2.5s
- **CLS**: Cumulative Layout Shift < 0.1
- **FID**: First Input Delay < 100ms

### Error Tracking
```typescript
// Error boundary pour React
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log vers service monitoring
    console.error('React Error:', error, errorInfo);
  }
}

// API Error tracking
const trackApiError = (error: ApiErrorResponse) => {
  // Analytics service
  console.error('API Error:', error);
};
```

## 🔄 Workflow de Développement

### Git Flow
```bash
# Feature branch
git checkout -b feature/nouvelle-fonctionnalite
git commit -m "feat: ajout fonctionnalité X"
git push origin feature/nouvelle-fonctionnalite

# Pull Request avec review
# Merge vers main après validation
```

### CI/CD Pipeline
1. **Lint & Tests**: Validation code quality
2. **Build**: Génération bundle production
3. **Security Scan**: Vérification vulnérabilités
4. **Deploy**: Déploiement automatique

### Code Review Checklist
- [ ] Types TypeScript corrects
- [ ] Tests unitaires couvrant les nouveautés
- [ ] Responsive design validé
- [ ] Accessibility conforme
- [ ] Performance impact évalué
- [ ] Documentation mise à jour

---

Ce guide fournit une base solide pour maintenir et étendre l'application de gestion client SQLI avec les meilleures pratiques du développement frontend moderne.