package com.sqli.workshop.ddd.connaissance.client.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.lang.NonNull;

import com.sqli.workshop.ddd.connaissance.client.domain.models.Client;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Adresse;
import com.sqli.workshop.ddd.connaissance.client.domain.enums.SituationFamiliale;
import com.sqli.workshop.ddd.connaissance.client.domain.exceptions.AdresseInvalideException;
import com.sqli.workshop.ddd.connaissance.client.domain.exceptions.ClientInconnuException;

/**
 * Uses Cases métier de la fiche Connaissance Client
 */
public interface ConnaissanceClientService {

    default Client nouveauClient(@NonNull Client client) throws AdresseInvalideException {
        return null;
    }

    default List<Client> listerClients() {
        return List.of();
    }

    default Optional<Client> informationsClient(@NonNull UUID id) {
        return Optional.empty();
    }

    default Client changementAdresse(@NonNull UUID id, @NonNull Adresse adresse) throws AdresseInvalideException, ClientInconnuException {
        return null;
    }

    default Client changementSituation(@NonNull UUID id, @NonNull SituationFamiliale situationFamiliale, @NonNull Integer nombreEnfants) throws ClientInconnuException {
        return null;
    }

    default void supprimerClient(@NonNull UUID id) {
    }

    /**
     * Modification globale d'une fiche client existante.
     * Met à jour tous les champs de la fiche client de manière atomique.
     * Publie un événement Kafka si l'adresse a changé.
     * 
     * @param id l'identifiant unique du client à modifier
     * @param clientModifie les nouvelles données complètes du client
     * @return le client modifié
     * @throws ClientInconnuException si le client n'existe pas
     * @throws AdresseInvalideException si l'adresse est invalide (vérification API IGN)
     */
    default Client modifierClient(@NonNull UUID id, @NonNull Client clientModifie) throws ClientInconnuException, AdresseInvalideException {
        return null;
    }
}
