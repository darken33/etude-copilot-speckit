Feature: Connaissnce Client Create

  Background:
    * url baseUrl
    * def signInKeycloak = callonce read('ITCC-000-AUTHENT.feature@use_user_1')
    * def jwtToken = signInKeycloak.response.access_token

  @ITCC-CREATE-UC01
  Scenario: ITCC-CREATE-UC01 - Post /v1/connaissance-clients - ok
    * print 'ITCC-CREATE-UC01 - Post /v1/connaissance-clients - ok'
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Bousquet", "prenom": "Philippe", "ligne1": "48 rue bauducheu", "codePostal": "33800", "ville": "Bordeaux", "situationFamiliale": "CELIBATAIRE", "nombreEnfants": 0 }
    When method post
    Then status 201
    * match $ contains {id:"#notnull"}
    * print 'END ITCC-CREATE-UC01 - Post /v1/connaissance-clients - ok'

  @ITCC-CREATE-UC02
  Scenario: ITCC-CREATE-UC02 - Post /v1/connaissance-clients - nom invalide
    * print 'ITCC-CREATE-UC02 - Post /v1/connaissance-clients - nom invalide'
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Bousquet$^/123", "prenom": "Philippe", "ligne1": "48 rue bauducheu", "codePostal": "33800", "ville": "Bordeaux", "situationFamiliale": "CELIBATAIRE", "nombreEnfants": 0 }
    When method post
    Then status 400
    * print 'END ITCC-CREATE-UC02 - Post /v1/connaissance-clients - nom invalide'

  @ITCC-CREATE-UC03
  Scenario: ITCC-CREATE-UC03 - Post /v1/connaissance-clients - Création avec situation DIVORCE
    * print 'ITCC-CREATE-UC03 - Post /v1/connaissance-clients - DIVORCE'
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Martin", "prenom": "Sophie", "ligne1": "5 avenue Victor Hugo", "codePostal": "69001", "ville": "Lyon", "situationFamiliale": "DIVORCE", "nombreEnfants": 2 }
    When method post
    Then status 201
    * match $ contains {id:"#notnull"}
    * match $.situationFamiliale == 'DIVORCE'
    * match $.nombreEnfants == 2
    * print 'END ITCC-CREATE-UC03 - Création DIVORCE réussie'

  @ITCC-CREATE-UC04
  Scenario: ITCC-CREATE-UC04 - Post /v1/connaissance-clients - Création avec situation VEUF
    * print 'ITCC-CREATE-UC04 - Post /v1/connaissance-clients - VEUF'
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Dubois", "prenom": "Pierre", "ligne1": "12 rue de la République", "codePostal": "13001", "ville": "Marseille", "situationFamiliale": "VEUF", "nombreEnfants": 1 }
    When method post
    Then status 201
    * match $ contains {id:"#notnull"}
    * match $.situationFamiliale == 'VEUF'
    * match $.nombreEnfants == 1
    * print 'END ITCC-CREATE-UC04 - Création VEUF réussie'

  @ITCC-CREATE-UC05
  Scenario: ITCC-CREATE-UC05 - Post /v1/connaissance-clients - Création avec situation MARIE
    * print 'ITCC-CREATE-UC05 - Post /v1/connaissance-clients - MARIE'
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Bernard", "prenom": "Julie", "ligne1": "8 place de la Liberté", "codePostal": "31000", "ville": "Toulouse", "situationFamiliale": "MARIE", "nombreEnfants": 3 }
    When method post
    Then status 201
    * match $ contains {id:"#notnull"}
    * match $.situationFamiliale == 'MARIE'
    * match $.nombreEnfants == 3
    * print 'END ITCC-CREATE-UC05 - Création MARIE réussie'
