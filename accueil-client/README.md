# Gestion Client SQLI - Frontend Application

Une application web moderne pour la gestion de la connaissance client, développée en React avec TypeScript.

## 🚀 Fonctionnalités

- **Gestion complète des clients** : Création, lecture, mise à jour partielle et suppression
- **Interface utilisateur moderne** : Design responsive avec une UX optimisée
- **Validation des données** : Validation côté client et serveur selon les spécifications OpenAPI
- **Recherche et filtrage** : Recherche en temps réel parmi les clients
- **Mise à jour partielle** : Mise à jour séparée de l'adresse et de la situation familiale
  - Les champs nom et prénom ne sont pas modifiables (grisés en mode édition)
- **Gestion d'erreurs** : Affichage d'erreurs contextuelles et gestion des cas d'échec
- **Champs optionnels intelligents** : Les champs vides (ex: ligne2) ne sont pas envoyés à l'API

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Backend API Connaissance Client en fonctionnement

## 🛠️ Installation

1. Clonez le repository :
```bash
git clone <repository-url>
cd accueil-client
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
# Copiez le fichier d'environnement de développement
cp .env.development .env.local

# Modifiez l'URL de l'API si nécessaire
# REACT_APP_API_BASE_URL=http://localhost:8080
```

## 🚀 Démarrage

### Développement
```bash
npm start
```
L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Production
```bash
# Build de production
npm run build

# Les fichiers sont générés dans le dossier 'build/'
```

### Tests
```bash
# Exécuter les tests
npm test

# Tests avec couverture
npm run test -- --coverage
```

## 🏗️ Architecture

### Principe fondamental : Séparation des préoccupations

Ce projet suit les principes définis dans [`.specify/memory/constitution.md`](.specify/memory/constitution.md), notamment le **Principe I** qui impose une séparation stricte entre :
- **Logique métier** : Hooks personnalisés dans `src/hooks/`
- **Présentation** : Composants React avec JSX uniquement dans `src/components/`

Cette architecture garantit :
- ✅ Testabilité unitaire du code métier (indépendamment de l'UI)
- ✅ Réutilisabilité des hooks dans plusieurs composants
- ✅ Lisibilité accrue des composants (focus sur le rendu)
- ✅ Maintenance facilitée (logique isolée dans un seul fichier)

### Structure du projet
```
src/
├── components/         # Composants React (présentation uniquement)
│   ├── ClientList.tsx     # Liste des clients
│   ├── ClientForm.tsx     # Formulaire de création/modification
│   └── *.css             # Styles des composants
├── hooks/             # 🆕 Custom hooks (logique métier)
│   ├── useClientForm.ts   # Logique du formulaire client
│   └── __tests__/        # Tests unitaires des hooks
│       └── useClientForm.test.ts
├── services/          # Services API et logique métier
│   └── api.ts            # Client API pour l'interface REST
├── types/             # Types TypeScript
│   └── api.ts            # Types générés depuis OpenAPI
├── utils/             # Utilitaires et helpers
│   └── validation.ts     # Fonctions de validation
├── App.tsx            # Composant principal
├── index.tsx          # Point d'entrée
└── index.css          # Styles globaux
```

**Exemple d'architecture (ClientForm) :**
- `ClientForm.tsx` (~220 lignes) : Rendu JSX uniquement, appelle `useClientForm()`
- `useClientForm.ts` (~200 lignes) : Toute la logique métier (validation, API, états)
- `useClientForm.test.ts` (~300 lignes) : 12 tests unitaires du hook

### Technologies utilisées
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **React Hook Form** : Gestion des formulaires
- **Axios** : Client HTTP
- **React Router Dom** : Navigation
- **CSS Modules** : Styles isolés

## 🔧 Configuration

### Variables d'environnement
- `REACT_APP_API_BASE_URL` : URL de base de l'API backend
- `REACT_APP_APP_NAME` : Nom de l'application
- `REACT_APP_VERSION` : Version de l'application
- `REACT_APP_DEBUG` : Mode debug (true/false)

### API Backend
L'application communique avec l'API Connaissance Client via les endpoints suivants :
- `GET /v1/connaissance-clients` : Liste des clients
- `POST /v1/connaissance-clients` : Création d'un nouveau client
- `GET /v1/connaissance-clients/{id}` : Détails d'un client
- `DELETE /v1/connaissance-clients/{id}` : Suppression d'un client
- `PUT /v1/connaissance-clients/{id}` : Modification globale d'un client
- `PUT /v1/connaissance-clients/{id}/adresse` : Mise à jour adresse
- `PUT /v1/connaissance-clients/{id}/situation` : Mise à jour situation

**Nouveau :** La modification globale d'un client existant est désormais possible via `PUT /v1/connaissance-clients/{id}`. Tous les champs, y compris nom et prénom, sont modifiables lors de l'édition.

## 🔒 Sécurité

- **Validation des données** : Validation complète côté client et serveur
- **Sanitisation des entrées** : Protection contre les injections
- **CORS** : Configuration appropriée pour les environnements

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte aux différentes tailles d'écran :
- Desktop (1200px+)
- Tablette (768px - 1199px)
- Mobile (320px - 767px)

## 🎨 Personnalisation

### Thème et couleurs
Les couleurs principales peuvent être modifiées dans les fichiers CSS :
- Primaire : `#007bff` (Bleu SQLI)
- Secondaire : `#6c757d` (Gris)
- Succès : `#28a745` (Vert)
- Erreur : `#dc3545` (Rouge)

### Styles
Les styles suivent une approche modulaire avec CSS classique pour faciliter la maintenance.

## 🧪 Tests

Le projet inclut des tests unitaires pour :
- Composants React
- Services API
- Fonctions utilitaires
- Validation des données

```bash
# Tests en mode watch
npm test

# Tests avec couverture
npm test -- --coverage --watchAll=false
```

## 📦 Déploiement

### Build de production
```bash
npm run build
```

### Déploiement sur Azure/AWS/Netlify
1. Configurez les variables d'environnement de production
2. Lancez le build de production
3. Déployez le contenu du dossier `build/`

### Docker (optionnel)
```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🐛 Dépannage

### Problèmes courants

**Erreur de connexion à l'API** :
- Vérifiez que le backend est démarré
- Contrôlez l'URL dans `REACT_APP_API_BASE_URL`
- Vérifiez la configuration CORS du backend

**Erreurs de validation** :
- Vérifiez que les données respectent les contraintes OpenAPI
- Consultez la console pour les détails des erreurs

**Problèmes de build** :
```bash
# Nettoyer le cache
npm run build -- --clean

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation API

L'application utilise l'API Connaissance Client documentée dans le fichier `spec/connaissance-client-api.yaml`.

### Schéma de données principal

```typescript
interface ConnaissanceClient {
  id: string;
  nom: string;            // 2-50 chars, lettres seulement (non modifiable)
  prenom: string;         // 2-50 chars, lettres seulement (non modifiable)
  ligne1: string;         // 2-50 chars, adresse
  ligne2?: string;        // 2-50 chars, complément (optionnel, non envoyé si vide)
  codePostal: string;     // 5 chars, lettres majuscules et chiffres
  ville: string;          // 2-50 chars, lettres seulement
  situationFamiliale: 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF' | 'PACSE';
  nombreEnfants: number; // 0-20
}
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de code
- Utilisez TypeScript pour tout nouveau code
- Suivez les règles ESLint configurées
- Écrivez des tests pour les nouvelles fonctionnalités
- Documentez les fonctions publiques

## 📄 Licence

Copyright (c) 2025 SQLI. Tous droits réservés.

## 📞 Support

- **Email** : pbousquet@sqli.com
- **Site web** : [sqli.com](http://sqli.com/)

---

*Application développée avec ❤️ par l'équipe SQLI*