const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper functions
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { "connaissance-clients": [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Routes

// Routes

// Route pour lister tous les clients
app.get('/v1/connaissance-clients', (req, res) => {
  const db = readDB();
  const clients = db['connaissance-clients'] || [];
  res.json(clients);
});

// Route pour créer/mettre à jour un client
app.post('/v1/connaissance-clients', (req, res) => {
  const db = readDB();
  const newClient = req.body;
  
  // Validation basique
  if (!newClient.nom || !newClient.prenom || !newClient.ligne1 || 
      !newClient.codePostal || !newClient.ville || !newClient.situationFamiliale ||
      newClient.nombreEnfants === undefined) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Champs obligatoires manquants",
      path: "/v1/connaissance-clients"
    });
  }
  
  // Générer un nouvel ID si pas existant
  if (!newClient.id) {
    newClient.id = generateUUID();
  }
  
  // Ajouter ou mettre à jour
  const clients = db['connaissance-clients'] || [];
  const existingIndex = clients.findIndex(c => c.id === newClient.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = newClient;
  } else {
    clients.push(newClient);
  }
  
  db['connaissance-clients'] = clients;
  writeDB(db);
  
  res.status(201).json(newClient);
});

// Route pour récupérer un client par ID
app.get('/v1/connaissance-clients/:id', (req, res) => {
  const db = readDB();
  const clients = db['connaissance-clients'] || [];
  const client = clients.find(c => c.id === req.params.id);
  
  if (!client) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: "Not Found",
      message: `Client avec l'ID ${req.params.id} non trouvé`,
      path: req.path
    });
  }
  
  res.json(client);
});

// Route pour supprimer un client
app.delete('/v1/connaissance-clients/:id', (req, res) => {
  const db = readDB();
  const clients = db['connaissance-clients'] || [];
  const clientIndex = clients.findIndex(c => c.id === req.params.id);
  
  if (clientIndex === -1) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: "Not Found",
      message: `Client avec l'ID ${req.params.id} non trouvé`,
      path: req.path
    });
  }
  
  clients.splice(clientIndex, 1);
  db['connaissance-clients'] = clients;
  writeDB(db);
  
  res.status(200).json({ message: "Client supprimé avec succès" });
});

// Route pour mettre à jour l'adresse
app.put('/v1/connaissance-clients/:id/adresse', (req, res) => {
  const db = readDB();
  const clients = db['connaissance-clients'] || [];
  const clientIndex = clients.findIndex(c => c.id === req.params.id);
  
  if (clientIndex === -1) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: "Not Found",
      message: `Client avec l'ID ${req.params.id} non trouvé`,
      path: req.path
    });
  }
  
  const adresse = req.body;
  if (!adresse.ligne1 || !adresse.codePostal || !adresse.ville) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Champs obligatoires manquants pour l'adresse",
      path: req.path
    });
  }
  
  const client = clients[clientIndex];
  const updatedClient = {
    ...client,
    ligne1: adresse.ligne1,
    ligne2: adresse.ligne2 || '',
    codePostal: adresse.codePostal,
    ville: adresse.ville
  };
  
  clients[clientIndex] = updatedClient;
  db['connaissance-clients'] = clients;
  writeDB(db);
  
  res.json(updatedClient);
});

// Route pour mettre à jour la situation familiale
app.put('/v1/connaissance-clients/:id/situation', (req, res) => {
  const db = readDB();
  const clients = db['connaissance-clients'] || [];
  const clientIndex = clients.findIndex(c => c.id === req.params.id);
  
  if (clientIndex === -1) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: "Not Found",
      message: `Client avec l'ID ${req.params.id} non trouvé`,
      path: req.path
    });
  }
  
  const situation = req.body;
  if (!situation.situationFamiliale || situation.nombreEnfants === undefined) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Champs obligatoires manquants pour la situation familiale",
      path: req.path
    });
  }
  
  const client = clients[clientIndex];
  const updatedClient = {
    ...client,
    situationFamiliale: situation.situationFamiliale,
    nombreEnfants: situation.nombreEnfants
  };
  
  clients[clientIndex] = updatedClient;
  db['connaissance-clients'] = clients;
  writeDB(db);
  
  res.json(updatedClient);
});

// Route de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(8080, () => {
  console.log('🚀 Backend Mock Server démarré sur http://localhost:8080');
  console.log('📋 API Endpoints disponibles:');
  console.log('   GET    /v1/connaissance-clients       - Liste des clients');
  console.log('   POST   /v1/connaissance-clients       - Créer/modifier un client');
  console.log('   GET    /v1/connaissance-clients/:id   - Détails d\'un client');
  console.log('   DELETE /v1/connaissance-clients/:id   - Supprimer un client');
  console.log('   PUT    /v1/connaissance-clients/:id/adresse - Modifier l\'adresse');
  console.log('   PUT    /v1/connaissance-clients/:id/situation - Modifier la situation');
  console.log('   GET    /health                        - Health check');
});