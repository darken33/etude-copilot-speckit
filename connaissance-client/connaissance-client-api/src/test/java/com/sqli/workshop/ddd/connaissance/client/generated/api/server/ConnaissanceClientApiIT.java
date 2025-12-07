package com.sqli.workshop.ddd.connaissance.client.generated.api.server;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sqli.workshop.ddd.connaissance.client.api.ConnaissanceClientDelegate;
import com.sqli.workshop.ddd.connaissance.client.domain.ConnaissanceClientService;
import com.sqli.workshop.ddd.connaissance.client.domain.ConnaissanceClientServiceImpl;
import com.sqli.workshop.ddd.connaissance.client.domain.enums.SituationFamiliale;
import com.sqli.workshop.ddd.connaissance.client.domain.models.Client;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Adresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.CodePostal;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Ville;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.LigneAdresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Nom;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Prenom;
import com.sqli.workshop.ddd.connaissance.client.domain.ports.AdresseEventService;
import com.sqli.workshop.ddd.connaissance.client.domain.ports.CodePostauxService;
import com.sqli.workshop.ddd.connaissance.client.domain.ports.ClientRepository;
import com.sqli.workshop.ddd.connaissance.client.generated.api.model.ConnaissanceClientDto;
import com.sqli.workshop.ddd.connaissance.client.generated.api.model.SituationFamilialeDto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

//@ContextConfiguration()//classes = { ApplicationConfig.class })
//@SpringBootTest
public class ConnaissanceClientApiIT {

    private ConnaissanceClientApiController controller;
    private ConnaissanceClientApiDelegate delegate;
    private ConnaissanceClientService service;
    private ClientRepository repository;
    private CodePostauxService cpService;
    private AdresseEventService adresseEventService;

    private MockMvc mockMvc;

    private JacksonTester<ConnaissanceClientDto> connaissanceClientDtoJacksonTester;

    public static ObjectMapper buildJsonMapper() {
        var result = new ObjectMapper();

        // Mapping auto des types date Java 8
        result.registerModule(new JavaTimeModule());
        SimpleModule simpleModule = new SimpleModule();

        // Ajout d'un Serializer pour les types OffsetDateTime (pour un bon formatage)
        simpleModule.addSerializer(OffsetDateTime.class, new JsonSerializer<OffsetDateTime>() {
            @Override
            public void serialize(OffsetDateTime offsetDateTime, JsonGenerator jsonGenerator,
                                  SerializerProvider serializerProvider) throws IOException {
                jsonGenerator.writeString(DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(offsetDateTime));
            }
        });

        result.registerModule(simpleModule);

        return result;
    }

    private static Object answerNouveauClient(InvocationOnMock invocationOnMock) {
        return invocationOnMock.getArgument(0);
    }

    @BeforeEach
    public void setup() throws Exception {
        ObjectMapper objectMapper = buildJsonMapper();
        JacksonTester.initFields(this, objectMapper);
        repository = mock(ClientRepository.class);
        cpService = mock(CodePostauxService.class);
        adresseEventService = mock(AdresseEventService.class);
        service = new ConnaissanceClientServiceImpl(repository, cpService, adresseEventService);
        delegate = new ConnaissanceClientDelegate(service, Optional.empty());
        controller = new ConnaissanceClientApiController(delegate);
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    public void given_get_connaissanceClients() throws Exception {
        // GIVEN
        Client cc = Client.of(
                UUID.fromString("ac95b4b6-144c-4c3a-9677-9f69ef3f36a3"),
                new Nom("Bousquet"),
                new Prenom("Philippe"),
                new Adresse(
                        new LigneAdresse("48 rue bauducheu"),
                        new CodePostal("33800"),
                        new Ville("Bordeaux")
                ),
                SituationFamiliale.CELIBATAIRE,
                0
        );
        Mockito.when(repository.lister()).thenReturn(List.of(cc));
        // WHEN
        MockHttpServletResponse response = mockMvc
                .perform(get("/v1/connaissance-clients")
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        // THEN
        assertEquals(HttpStatus.OK.value(), response.getStatus());
        assertEquals(
                "[{\"id\":\"ac95b4b6-144c-4c3a-9677-9f69ef3f36a3\",\"nom\":\"Bousquet\",\"prenom\":\"Philippe\",\"ligne1\":\"48 rue bauducheu\",\"ligne2\":null,\"codePostal\":\"33800\",\"ville\":\"Bordeaux\",\"situationFamiliale\":\"CELIBATAIRE\",\"nombreEnfants\":0}]",
                response.getContentAsString());
    }

    @Test
    public void given_post_connaissanceClients() throws Exception {
        // GIVEN
        ConnaissanceClientDto cc = new ConnaissanceClientDto();
        cc.setNom("Bousquet");
        cc.setPrenom("Philippe");
        cc.setLigne1("48 rue bauducheu");
        cc.setCodePostal("33800");
        cc.setVille("Bordeaux");
        cc.setSituationFamiliale(SituationFamilialeDto.CELIBATAIRE);
        cc.setNombreEnfants(0);
        ResponseEntity<ConnaissanceClientDto> responseDelegate = ResponseEntity.ok(cc);
        Mockito.when(cpService.validateCodePostal(any(), any())).thenReturn(Boolean.TRUE);
        Mockito.when(repository.enregistrer(any())).thenAnswer(ConnaissanceClientApiIT::answerNouveauClient);
        // WHEN
        MockHttpServletResponse response = mockMvc
                .perform(post("/v1/connaissance-clients")
                .content(connaissanceClientDtoJacksonTester.write(cc).getJson())
                .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        // THEN
        assertEquals(HttpStatus.CREATED.value(), response.getStatus());
        assertTrue(response.getContentAsString().contains("Bousquet"));
    }

    @Test
    public void given_post_bad_connaissanceClients() throws Exception {
        // GIVEN
        ConnaissanceClientDto cc = new ConnaissanceClientDto();
        cc.setNom("Bou$wx");
        cc.setPrenom("Philippe");
        cc.setLigne1("48 rue bauducheu");
        cc.setCodePostal("33800");
        cc.setVille("Bordeaux");
        cc.setSituationFamiliale(SituationFamilialeDto.CELIBATAIRE);
        cc.setNombreEnfants(0);
        // WHEN
        MockHttpServletResponse response = mockMvc
                .perform(post("/v1/connaissance-clients")
                        .content(connaissanceClientDtoJacksonTester.write(cc).getJson())
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        // THEN
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    }
}
