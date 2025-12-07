import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ClientList } from './components/ClientList';
import { ClientForm } from './components/ClientForm';
import { ConnaissanceClient } from './types/api';
import './App.css';
import logoSQLI from './assets/logo-sqli.png';

interface AppState {
  currentView: 'list' | 'form';
  selectedClient?: ConnaissanceClient;
  refreshTrigger: number;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'list',
    refreshTrigger: 0
  });

  const handleClientSelect = (client: ConnaissanceClient) => {
    setState({
      ...state,
      currentView: 'form',
      selectedClient: client
    });
  };

  const handleNewClient = () => {
    setState({
      ...state,
      currentView: 'form',
      selectedClient: undefined
    });
  };

  const handleSave = () => {
    setState({
      ...state,
      currentView: 'list',
      selectedClient: undefined,
      refreshTrigger: state.refreshTrigger + 1
    });
  };

  const handleCancel = () => {
    setState({
      ...state,
      currentView: 'list',
      selectedClient: undefined
    });
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-logo">
              <img src={logoSQLI} alt="SQLI Logo" className="header-logo" />
              <div>
                <h1>Accueil Client SQLI</h1>
                <p>Gestion des fiches de connaissance client</p>
              </div>
            </div>
            <nav className="app-nav">
              <button 
                onClick={() => setState({ ...state, currentView: 'list', selectedClient: undefined })}
                className={state.currentView === 'list' ? 'nav-btn active' : 'nav-btn'}
              >
                📋 Liste des Clients
              </button>
              <button 
                onClick={handleNewClient}
                className={state.currentView === 'form' && !state.selectedClient ? 'nav-btn active' : 'nav-btn'}
              >
                ➕ Nouveau Client
              </button>
            </nav>
          </div>
        </header>
        <main className="app-main">
            {state.currentView === 'list' ? (
              <ClientList
                onClientSelect={handleClientSelect}
                onNewClient={handleNewClient}
                refreshTrigger={state.refreshTrigger}
              />
            ) : (
              <ClientForm
                client={state.selectedClient}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </main>
          <footer className="app-footer">
            <div className="app-footer-content">
              <p>&copy; 2025 SQLI - Système de Gestion Client</p>
              <div className="app-footer-links">
                <a href="mailto:pbousquet@sqli.com">Contact</a>
                <a href="http://sqli.com/" target="_blank" rel="noopener noreferrer">SQLI.com</a>
              </div>
            </div>
          </footer>
      </div>
    </Router>
  );
};

export default App;