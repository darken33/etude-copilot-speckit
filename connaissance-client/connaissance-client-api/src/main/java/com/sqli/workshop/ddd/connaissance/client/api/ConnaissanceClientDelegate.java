package com.sqli.workshop.ddd.connaissance.client.api;

import com.sqli.workshop.ddd.connaissance.client.domain.ConnaissanceClientService;
import com.sqli.workshop.ddd.connaissance.client.domain.enums.SituationFamiliale;
import com.sqli.workshop.ddd.connaissance.client.domain.exceptions.AdresseInvalideException;
import com.sqli.workshop.ddd.connaissance.client.domain.exceptions.ClientInconnuException;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Adresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.CodePostal;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Destinataire;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.LigneAdresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Nom;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Prenom;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Ville;
import com.sqli.workshop.ddd.connaissance.client.domain.models.Client;
import com.sqli.workshop.ddd.connaissance.client.generated.api.model.*;
import com.sqli.workshop.ddd.connaissance.client.generated.api.server.ConnaissanceClientApiDelegate;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.NativeWebRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Slf4j
public class ConnaissanceClientDelegate implements ConnaissanceClientApiDelegate {

    private final ConnaissanceClientService service;
    private final NativeWebRequest request;

    public ConnaissanceClientDelegate(ConnaissanceClientService service, Optional<NativeWebRequest> request) {
        this.service = service;
        this.request = request.orElse(null);
    }

    @Override
    public ResponseEntity<List<ConnaissanceClientDto>> getConnaissanceClients() {
        return ResponseEntity.ok(
                service.listerClients().stream()
                        .map(this::mapToDto).collect(Collectors.toList()));
    }

    @Override
    public ResponseEntity<ConnaissanceClientDto> getConnaissanceClient(UUID id) {
        var connaissanceClient = service.informationsClient(id);
        if (connaissanceClient.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapToDto(connaissanceClient.get()));
    }

    @Override
    public ResponseEntity<ConnaissanceClientDto> saveConnaissanceClient(ConnaissanceClientInDto connaissanceClientDto) {
        Client connaissanceClient;
        try {
            connaissanceClient = service.nouveauClient(mapToDomain(connaissanceClientDto));
        } catch (AdresseInvalideException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDto(connaissanceClient));
    }

    @Override
    public ResponseEntity<ConnaissanceClientDto> changerSituation(UUID id, SituationDto situationDto) {
        Client connaissanceClient;
        try {
            connaissanceClient = service.changementSituation(id, SituationFamiliale.valueOf(situationDto.getSituationFamiliale().getValue()), situationDto.getNombreEnfants());
        } catch (ClientInconnuException e) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapToDto(connaissanceClient));
    }

    @Override
    public Optional<NativeWebRequest> getRequest() {
        return Optional.ofNullable(request);
    }

    @Override
    public ResponseEntity<ConnaissanceClientDto> changerAdresse(UUID id, AdresseDto adresseDto) {
        Client connaissanceClient = null;
        try {
          connaissanceClient = service.changementAdresse(id, mapToDomain(adresseDto));
        }
        catch (AdresseInvalideException | ClientInconnuException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(mapToDto(connaissanceClient));
    }

    private ConnaissanceClientDto mapToDto(Client connaissanceClient) {
        ConnaissanceClientDto connaissanceClientDto = new ConnaissanceClientDto();
        connaissanceClientDto.setId(connaissanceClient.getId());
        connaissanceClientDto.setNom(connaissanceClient.getNom().value());
        connaissanceClientDto.setPrenom(connaissanceClient.getPrenom().value());
        connaissanceClientDto.setLigne1(connaissanceClient.getAdresse().ligne1().value());
        if (connaissanceClient.getAdresse().ligne2().isPresent()) {
            connaissanceClientDto.setLigne2(connaissanceClient.getAdresse().ligne2().get().value());
        }
        connaissanceClientDto.setCodePostal(connaissanceClient.getAdresse().codePostal().value());
        connaissanceClientDto.setVille(connaissanceClient.getAdresse().ville().value());
        connaissanceClientDto.setSituationFamiliale(SituationFamilialeDto.fromValue(connaissanceClient.getSituationFamiliale().toString()));
        connaissanceClientDto.setNombreEnfants(connaissanceClient.getNombreEnfants());
        return connaissanceClientDto;
    }

    @Override
    public ResponseEntity<Void> deleteConnaissanceClient(UUID id) {
        service.supprimerClient(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint REST PUT pour la modification globale d'une fiche client.
     * <p>
     * Implémente le pattern API-First avec génération OpenAPI et respecte l'architecture hexagonale
     * en délégant la logique métier au {@link ConnaissanceClientService}.
     * 
     * <p><strong>Sémantique HTTP :</strong>
     * <ul>
     *   <li>200 OK : Modification réussie, retourne la fiche complète</li>
     *   <li>404 Not Found : Client inexistant</li>
     *   <li>422 Unprocessable Entity : Adresse invalide (validation API IGN échouée)</li>
     *   <li>500 Internal Server Error : Erreur serveur inattendue</li>
     * </ul>
     * 
     * <p><strong>Observabilité :</strong>
     * <ul>
     *   <li>Corrélation des requêtes via header X-Correlation-ID (propagé ou généré)</li>
     *   <li>Logging structuré avec MDC (correlationId, operation, clientId)</li>
     *   <li>Métriques Prometheus pour latence et taux d'erreur</li>
     * </ul>
     * 
     * <p><strong>Événementiel :</strong> Publication Kafka automatique si l'adresse change.
     * 
     * @param id l'identifiant UUID du client à modifier
     * @param connaissanceClientInDto les nouvelles données complètes du client (DTO OpenAPI)
     * @return ResponseEntity avec le client modifié (200), ou erreur (404/422/500)
     * 
     * @see ConnaissanceClientService#modifierClient(UUID, Client)
     */
    @Override
    public ResponseEntity<ConnaissanceClientDto> modifierClient(UUID id, ConnaissanceClientInDto connaissanceClientInDto) {
        try {
            // Setup correlation-id from request header or generate new one
            String correlationId = extractOrGenerateCorrelationId();
            MDC.put("correlationId", correlationId);
            
            log.info("Processing modifierClient request for client: {}", id);
            
            // Call domain service
            Client updatedClient = service.modifierClient(id, mapToDomain(connaissanceClientInDto));
            
            log.debug("Client {} modified successfully", id);
            
            // Build response with correlation-id header
            return ResponseEntity.ok()
                    .header("X-Correlation-ID", correlationId)
                    .body(mapToDto(updatedClient));
                    
        } catch (ClientInconnuException e) {
            log.warn("Client not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            
        } catch (AdresseInvalideException e) {
            log.warn("Invalid address for client: {}", id);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).build();
            
        } catch (Exception e) {
            log.error("Unexpected error modifying client {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            
        } finally {
            MDC.remove("correlationId");
        }
    }
    
    /**
     * Extrait le correlation-id du header HTTP X-Correlation-ID ou génère un nouvel UUID.
     * <p>
     * Le correlation-id permet de tracer une requête à travers tous les systèmes distribués.
     * Il est utilisé pour :
     * <ul>
     *   <li>Logs structurés avec MDC (SLF4J)</li>
     *   <li>Propagation dans les événements Kafka</li>
     *   <li>Corrélation des traces distribuées (APM)</li>
     *   <li>Diagnostic en cas d'incident (retrouver tous les logs d'une requête)</li>
     * </ul>
     * 
     * <p><strong>Algorithme :</strong>
     * <ol>
     *   <li>Si le header X-Correlation-ID existe et n'est pas vide : le réutiliser</li>
     *   <li>Sinon : générer un nouvel UUID v4</li>
     * </ol>
     * 
     * <p><strong>Format :</strong> UUID v4 (ex: 550e8400-e29b-41d4-a716-446655440000)
     * 
     * @return correlation-id extrait du header ou nouvellement généré (jamais null)
     */
    private String extractOrGenerateCorrelationId() {
        if (request != null) {
            HttpServletRequest nativeRequest = request.getNativeRequest(HttpServletRequest.class);
            if (nativeRequest != null) {
                String correlationId = nativeRequest.getHeader("X-Correlation-ID");
                if (correlationId != null && !correlationId.isEmpty()) {
                    return correlationId;
                }
            }
        }
        return UUID.randomUUID().toString();
    }

    private Client mapToDomain(ConnaissanceClientInDto connaissanceClientDto) {
        return Client.of(
                new Nom(connaissanceClientDto.getNom()),
                new Prenom(connaissanceClientDto.getPrenom()),
                (connaissanceClientDto.getLigne2() != null ?
                    new Adresse (
                        new LigneAdresse(connaissanceClientDto.getLigne1()),
                        new LigneAdresse(connaissanceClientDto.getLigne2()),
                        new CodePostal(connaissanceClientDto.getCodePostal()),
                        new Ville(connaissanceClientDto.getVille())
                    ) :
                    new Adresse (
                        new LigneAdresse(connaissanceClientDto.getLigne1()),
                        new CodePostal(connaissanceClientDto.getCodePostal()),
                        new Ville(connaissanceClientDto.getVille())
                    )
                ),
                SituationFamiliale.valueOf(connaissanceClientDto.getSituationFamiliale().getValue()),
                connaissanceClientDto.getNombreEnfants()
        );
    }

    private Adresse mapToDomain(AdresseDto adresseDto) {
        return (adresseDto.getLigne2() != null ?
                new Adresse(
                    new LigneAdresse(adresseDto.getLigne1()),
                    new LigneAdresse(adresseDto.getLigne2()),
                    new CodePostal(adresseDto.getCodePostal()),
                    new Ville(adresseDto.getVille())
                ) :
                new Adresse(
                    new LigneAdresse(adresseDto.getLigne1()),
                    new CodePostal(adresseDto.getCodePostal()),
                    new Ville(adresseDto.getVille())
                )
            );
    }
}
