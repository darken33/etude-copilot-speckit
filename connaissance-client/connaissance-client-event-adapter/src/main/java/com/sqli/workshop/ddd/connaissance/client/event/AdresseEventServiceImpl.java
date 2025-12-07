package com.sqli.workshop.ddd.connaissance.client.event;

import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Destinataire;
import com.sqli.workshop.ddd.connaissance.client.domain.ports.AdresseEventService;
import com.sqli.workshop.ddd.connaissance.client.generated.event.model.Adresse;
import com.sqli.workshop.ddd.connaissance.client.generated.event.model.AdresseMessagePayload;
import com.sqli.workshop.ddd.connaissance.client.generated.event.producer.IDefaultServiceEventsProducer;

import java.util.UUID;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class AdresseEventServiceImpl implements AdresseEventService {
    
    IDefaultServiceEventsProducer adresseEventService;

    @Override
    public boolean sendEvent(UUID id, Destinataire destinataire,
            com.sqli.workshop.ddd.connaissance.client.domain.models.types.Adresse adresse) {
                System.out.println("AdresseEventService : create Payload");
                AdresseMessagePayload payload = new AdresseMessagePayload();
                payload.setClientId(id.toString());
                Adresse adresseMsg = new Adresse();
                adresseMsg.setDestinataire(destinataire.nom().value() + " " + destinataire.prenom().value());
                adresseMsg.setCodePostal(adresse.codePostal().value());
                adresseMsg.setLigne1(adresse.ligne1().value());
                if (adresse.ligne2().isPresent()) {
                    adresseMsg.setLigne2(adresse.ligne2().get().value());
                }
                adresseMsg.setVille(adresse.ville().value());
                payload.setAdresse(adresseMsg);
                System.out.println("AdresseEventService : send Payload");
                adresseEventService.sendAdresseMessage(payload);
                System.out.println("AdresseEventService : Payload sent");
                return true;
            }

}
