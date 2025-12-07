import React, { useState, useEffect } from 'react';
import { ConnaissanceClient } from '../types/api';
import { ConnaissanceClientAPI } from '../services/api';
import { formatDisplayName, formatAddress, formatSituationFamiliale } from '../utils/validation';
import './ClientList.css';

interface ClientListProps {
  onClientSelect: (client: ConnaissanceClient) => void;
  onNewClient: () => void;
  refreshTrigger: number;
}

export const ClientList: React.FC<ClientListProps> = ({
  onClientSelect,
  onNewClient,
  refreshTrigger
}) => {
  const [clients, setClients] = useState<ConnaissanceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, [refreshTrigger]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await ConnaissanceClientAPI.getConnaissanceClients();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      await ConnaissanceClientAPI.deleteConnaissanceClient(id);
      setClients(clients.filter(client => client.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.nom.toLowerCase().includes(searchLower) ||
      client.prenom.toLowerCase().includes(searchLower) ||
      client.ville.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="client-list loading">Chargement des clients...</div>;
  }

  if (error) {
    return (
      <div className="client-list error">
        <p>Erreur: {error}</p>
        <button onClick={fetchClients} className="retry-btn">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="client-list">
      <div className="client-list-header">
        <h2>Liste des Clients</h2>
        <div className="client-list-actions">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={onNewClient} className="new-client-btn">
            Nouveau Client
          </button>
        </div>
      </div>

      <div className="client-list-content">
        {filteredClients.length === 0 ? (
          <div className="no-clients">
            {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
          </div>
        ) : (
          <div className="clients-grid">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="client-card"
                onClick={() => onClientSelect(client)}
              >
                <div className="client-card-header">
                  <h3>{formatDisplayName(client.nom, client.prenom)}</h3>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(client.id, e)}
                    title="Supprimer le client"
                  >
                    ×
                  </button>
                </div>
                <div className="client-card-body">
                  <p className="client-address">
                    📍 {formatAddress(client.ligne1, client.ligne2, client.codePostal, client.ville)}
                  </p>
                  <div className="client-details">
                    <span className="client-situation">
                      👥 {formatSituationFamiliale(client.situationFamiliale)}
                    </span>
                    <span className="client-enfants">
                      👶 {client.nombreEnfants} enfant{client.nombreEnfants > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};