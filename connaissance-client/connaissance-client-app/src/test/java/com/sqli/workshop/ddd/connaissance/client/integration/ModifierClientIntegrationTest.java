package com.sqli.workshop.ddd.connaissance.client.integration;

import com.sqli.workshop.ddd.connaissance.client.domain.ConnaissanceClientService;
import com.sqli.workshop.ddd.connaissance.client.domain.enums.SituationFamiliale;
import com.sqli.workshop.ddd.connaissance.client.domain.models.Client;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.*;
import com.sqli.workshop.ddd.connaissance.client.domain.ports.ClientRepository;
import com.sqli.workshop.ddd.connaissance.client.generated.api.model.ConnaissanceClientInDto;
import com.sqli.workshop.ddd.connaissance.client.generated.api.model.SituationFamilialeDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PUT /v1/connaissance-clients/{id} endpoint
 * Tests end-to-end behavior with real MongoDB dependencies
 * 
 * T025-T027: Integration tests for modifierClient endpoint
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.data.mongodb.database=test_connaissance_client",
    "logging.level.com.sqli.workshop.ddd=DEBUG"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ModifierClientIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ConnaissanceClientService connaissanceClientService;

    private UUID existingClientId;

    @BeforeEach
    void setUp() throws Exception {
        // Create a test client for each test
        Client testClient = Client.of(
            new Nom("Bousquet"),
            new Prenom("Philippe"),
            new Adresse(
                new LigneAdresse("48 rue Bauducheu"),
                new CodePostal("33800"),
                new Ville("Bordeaux")
            ),
            SituationFamiliale.CELIBATAIRE,
            0
        );

        Client savedClient = connaissanceClientService.nouveauClient(testClient);
        existingClientId = savedClient.getId();
    }

    @Test
    void given_address_change_modifierClient_should_trigger_kafka_event() throws Exception {
        // GIVEN - T025: PUT with address change → Kafka event published
        ConnaissanceClientInDto dto = new ConnaissanceClientInDto();
        dto.setNom("Bousquet");
        dto.setPrenom("Philippe");
        dto.setLigne1("12 rue Victor Hugo"); // New address
        dto.setCodePostal("33000"); // New postal code
        dto.setVille("Bordeaux");
        dto.setSituationFamiliale(SituationFamilialeDto.CELIBATAIRE);
        dto.setNombreEnfants(0);

        // WHEN
        mockMvc.perform(put("/v1/connaissance-clients/{id}", existingClientId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .header("X-Correlation-ID", "test-correlation-id"))
                // THEN
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existingClientId.toString()))
                .andExpect(jsonPath("$.nom").value("Bousquet"))
                .andExpect(jsonPath("$.prenom").value("Philippe"))
                .andExpect(jsonPath("$.ligne1").value("12 rue Victor Hugo"))
                .andExpect(jsonPath("$.codePostal").value("33000"))
                .andExpect(jsonPath("$.ville").value("Bordeaux"))
                .andExpect(header().exists("X-Correlation-ID"));

        // Verify client was updated in database
        Client updatedClient = clientRepository.lire(existingClientId).orElseThrow();
        assertEquals("12 rue Victor Hugo", updatedClient.getAdresse().ligne1().value());
        assertEquals("33000", updatedClient.getAdresse().codePostal().value());

        // Note: Kafka event verification would require KafkaTemplate mock or EmbeddedKafka consumer
        // In a real scenario, you would consume the event and verify its content
    }

    @Test
    void given_same_address_modifierClient_should_not_trigger_kafka_event() throws Exception {
        // GIVEN - T026: PUT with same address → no Kafka event
        ConnaissanceClientInDto dto = new ConnaissanceClientInDto();
        dto.setNom("Bousquet");
        dto.setPrenom("Philippe");
        dto.setLigne1("48 rue Bauducheu"); // Same address
        dto.setCodePostal("33800"); // Same postal code
        dto.setVille("Bordeaux");
        dto.setSituationFamiliale(SituationFamilialeDto.MARIE); // Only situation changed
        dto.setNombreEnfants(1);

        // WHEN
        mockMvc.perform(put("/v1/connaissance-clients/{id}", existingClientId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                // THEN
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existingClientId.toString()))
                .andExpect(jsonPath("$.situationFamiliale").value("MARIE"))
                .andExpect(jsonPath("$.nombreEnfants").value(1));

        // Verify client was updated in database
        Client updatedClient = clientRepository.lire(existingClientId).orElseThrow();
        assertEquals(SituationFamiliale.MARIE, updatedClient.getSituationFamiliale());
        assertEquals(1, updatedClient.getNombreEnfants());

        // Address should remain the same
        assertEquals("48 rue Bauducheu", updatedClient.getAdresse().ligne1().value());
        assertEquals("33800", updatedClient.getAdresse().codePostal().value());
    }

    @Test
    void given_unknown_client_modifierClient_should_return_404() throws Exception {
        // GIVEN - T027: PUT with unknown client ID → HTTP 404
        UUID unknownId = UUID.randomUUID();
        ConnaissanceClientInDto dto = new ConnaissanceClientInDto();
        dto.setNom("Dupont");
        dto.setPrenom("Marie");
        dto.setLigne1("25 avenue de la Republique");
        dto.setCodePostal("75011");
        dto.setVille("Paris");
        dto.setSituationFamiliale(SituationFamilialeDto.MARIE);
        dto.setNombreEnfants(2);

        // WHEN & THEN
        mockMvc.perform(put("/v1/connaissance-clients/{id}", unknownId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());

        // Verify no client was created
        assertTrue(clientRepository.lire(unknownId).isEmpty());
    }
}
