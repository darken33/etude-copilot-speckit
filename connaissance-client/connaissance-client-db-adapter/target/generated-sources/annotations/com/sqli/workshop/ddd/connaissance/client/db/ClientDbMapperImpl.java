package com.sqli.workshop.ddd.connaissance.client.db;

import com.sqli.workshop.ddd.connaissance.client.domain.models.Client;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Adresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.CodePostal;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.LigneAdresse;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Nom;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Prenom;
import com.sqli.workshop.ddd.connaissance.client.domain.models.types.Ville;
import java.util.Optional;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-07T07:49:59+0000",
    comments = "version: 1.4.2.Final, compiler: Eclipse JDT (IDE) 3.44.0.v20251118-1623, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class ClientDbMapperImpl implements ClientDbMapper {

    @Override
    public ClientDb mapFromDomain(Client cclient) {

        ClientDb clientDb = new ClientDb();

        if ( cclient != null ) {
            clientDb.setNom( cclientNomValue( cclient ) );
            clientDb.setPrenom( cclientPrenomValue( cclient ) );
            clientDb.setId( map( cclient.getId() ) );
            clientDb.setLigne1( cclientAdresseLigne1Value( cclient ) );
            clientDb.setLigne2( map( cclientAdresseLigne2( cclient ) ) );
            clientDb.setCodePostal( cclientAdresseCodePostalValue( cclient ) );
            clientDb.setVille( cclientAdresseVilleValue( cclient ) );
            clientDb.setNombreEnfants( cclient.getNombreEnfants() );
            if ( cclient.getSituationFamiliale() != null ) {
                clientDb.setSituationFamiliale( cclient.getSituationFamiliale().name() );
            }
        }

        return clientDb;
    }

    private String cclientNomValue(Client client) {
        if ( client == null ) {
            return null;
        }
        Nom nom = client.getNom();
        if ( nom == null ) {
            return null;
        }
        String value = nom.value();
        if ( value == null ) {
            return null;
        }
        return value;
    }

    private String cclientPrenomValue(Client client) {
        if ( client == null ) {
            return null;
        }
        Prenom prenom = client.getPrenom();
        if ( prenom == null ) {
            return null;
        }
        String value = prenom.value();
        if ( value == null ) {
            return null;
        }
        return value;
    }

    private String cclientAdresseLigne1Value(Client client) {
        if ( client == null ) {
            return null;
        }
        Adresse adresse = client.getAdresse();
        if ( adresse == null ) {
            return null;
        }
        LigneAdresse ligne1 = adresse.ligne1();
        if ( ligne1 == null ) {
            return null;
        }
        String value = ligne1.value();
        if ( value == null ) {
            return null;
        }
        return value;
    }

    private Optional<LigneAdresse> cclientAdresseLigne2(Client client) {
        if ( client == null ) {
            return null;
        }
        Adresse adresse = client.getAdresse();
        if ( adresse == null ) {
            return null;
        }
        Optional<LigneAdresse> ligne2 = adresse.ligne2();
        if ( ligne2 == null ) {
            return null;
        }
        return ligne2;
    }

    private String cclientAdresseCodePostalValue(Client client) {
        if ( client == null ) {
            return null;
        }
        Adresse adresse = client.getAdresse();
        if ( adresse == null ) {
            return null;
        }
        CodePostal codePostal = adresse.codePostal();
        if ( codePostal == null ) {
            return null;
        }
        String value = codePostal.value();
        if ( value == null ) {
            return null;
        }
        return value;
    }

    private String cclientAdresseVilleValue(Client client) {
        if ( client == null ) {
            return null;
        }
        Adresse adresse = client.getAdresse();
        if ( adresse == null ) {
            return null;
        }
        Ville ville = adresse.ville();
        if ( ville == null ) {
            return null;
        }
        String value = ville.value();
        if ( value == null ) {
            return null;
        }
        return value;
    }
}
