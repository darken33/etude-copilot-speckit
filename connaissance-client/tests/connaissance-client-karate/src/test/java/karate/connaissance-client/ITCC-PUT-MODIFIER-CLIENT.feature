Feature: Connaissance Client - Modification globale (PUT)

  Background:
    * url baseUrl
    * def signInKeycloak = callonce read('ITCC-000-AUTHENT.feature@use_user_1')
    * def jwtToken = signInKeycloak.response.access_token
    
    # Création d'un client de test pour les scénarios de modification
    Given path '/v1/connaissance-clients'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request { "nom": "Dupont", "prenom": "Jean", "ligne1": "10 rue de la Paix", "codePostal": "75001", "ville": "Paris", "situationFamiliale": "CELIBATAIRE", "nombreEnfants": 0 }
    When method post
    Then status 201
    * def clientId = response.id
    * print 'Client créé avec ID:', clientId

  @ITCC-PUT-UC01
  Scenario: ITCC-PUT-UC01 - PUT /v1/connaissance-clients/{id} - Modification complète réussie
    * print 'ITCC-PUT-UC01 - PUT /v1/connaissance-clients/{id} - Modification complète réussie'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And header X-Correlation-ID = 'test-correlation-001'
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "25 avenue de la Republique",
      "ligne2": "Appartement 3B",
      "codePostal": "75011",
      "ville": "Paris",
      "situationFamiliale": "MARIE",
      "nombreEnfants": 2
    }
    """
    When method put
    Then status 200
    And match response.id == clientId
    And match response.nom == 'Dupont'
    And match response.prenom == 'Jean'
    And match response.ligne1 == '25 avenue de la Republique'
    And match response.ligne2 == 'Appartement 3B'
    And match response.codePostal == '75011'
    And match response.ville == 'Paris'
    And match response.situationFamiliale == 'MARIE'
    And match response.nombreEnfants == 2
    * print 'END ITCC-PUT-UC01 - Modification complète réussie'

  @ITCC-PUT-UC02
  Scenario: ITCC-PUT-UC02 - PUT /v1/connaissance-clients/{id} - Changement d'adresse uniquement
    * print 'ITCC-PUT-UC02 - PUT /v1/connaissance-clients/{id} - Changement adresse'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And header X-Correlation-ID = 'test-correlation-002'
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "12 rue Victor Hugo",
      "codePostal": "33000",
      "ville": "Bordeaux",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 200
    And match response.ligne1 == '12 rue Victor Hugo'
    And match response.codePostal == '33000'
    And match response.ville == 'Bordeaux'
    * print 'END ITCC-PUT-UC02 - Changement adresse réussi'

  @ITCC-PUT-UC03
  Scenario: ITCC-PUT-UC03 - PUT /v1/connaissance-clients/{id} - Client non trouvé (404)
    * print 'ITCC-PUT-UC03 - PUT /v1/connaissance-clients/{id} - 404 Not Found'
    * def fakeClientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    Given path '/v1/connaissance-clients/' + fakeClientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Inexistant",
      "prenom": "Client",
      "ligne1": "1 rue Fictive",
      "codePostal": "99999",
      "ville": "Nowhere",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 404
    And match response.status == 404
    And match response.error == 'Not Found'
    * print 'END ITCC-PUT-UC03 - 404 vérifié'

  @ITCC-PUT-UC04
  Scenario: ITCC-PUT-UC04 - PUT /v1/connaissance-clients/{id} - Adresse invalide (422)
    * print 'ITCC-PUT-UC04 - PUT /v1/connaissance-clients/{id} - 422 Adresse invalide'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "Rue fictive",
      "codePostal": "99999",
      "ville": "VilleInvalide",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 422
    And match response.status == 422
    And match response.error == 'Unprocessable Entity'
    * print 'END ITCC-PUT-UC04 - 422 vérifié'

  @ITCC-PUT-UC05
  Scenario: ITCC-PUT-UC05 - PUT /v1/connaissance-clients/{id} - Validation des champs requis (400)
    * print 'ITCC-PUT-UC05 - PUT /v1/connaissance-clients/{id} - 400 Bad Request'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "prenom": "Jean",
      "ligne1": "10 rue Test",
      "codePostal": "75001",
      "ville": "Paris"
    }
    """
    When method put
    Then status 400
    And match response.status == 400
    * print 'END ITCC-PUT-UC05 - 400 vérifié (nom manquant)'

  @ITCC-PUT-UC06
  Scenario: ITCC-PUT-UC06 - PUT /v1/connaissance-clients/{id} - Format nom invalide (400)
    * print 'ITCC-PUT-UC06 - PUT /v1/connaissance-clients/{id} - Format invalide'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont123$%",
      "prenom": "Jean",
      "ligne1": "10 rue Test",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 400
    And match response.status == 400
    * print 'END ITCC-PUT-UC06 - 400 vérifié (format nom invalide)'

  @ITCC-PUT-UC07
  Scenario: ITCC-PUT-UC07 - PUT /v1/connaissance-clients/{id} - Vérification correlation-id
    * print 'ITCC-PUT-UC07 - PUT /v1/connaissance-clients/{id} - Correlation-ID'
    * def correlationId = 'karate-test-' + java.util.UUID.randomUUID()
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And header X-Correlation-ID = correlationId
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "15 rue de Test",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 200
    And match responseHeaders['X-Correlation-ID'][0] == correlationId
    * print 'END ITCC-PUT-UC07 - Correlation-ID propagé avec succès'

  @ITCC-PUT-UC08
  Scenario: ITCC-PUT-UC08 - PUT /v1/connaissance-clients/{id} - Code postal invalide (400)
    * print 'ITCC-PUT-UC08 - PUT /v1/connaissance-clients/{id} - Code postal invalide'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue Test",
      "codePostal": "ABC",
      "ville": "Paris",
      "situationFamiliale": "CELIBATAIRE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 400
    And match response.status == 400
    * print 'END ITCC-PUT-UC08 - 400 vérifié (code postal invalide)'

  @ITCC-PUT-UC09
  Scenario: ITCC-PUT-UC09 - PUT /v1/connaissance-clients/{id} - Situation familiale DIVORCE avec enfants
    * print 'ITCC-PUT-UC09 - PUT /v1/connaissance-clients/{id} - Modification DIVORCE'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And header X-Correlation-ID = 'test-correlation-divorce'
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue de la Paix",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "DIVORCE",
      "nombreEnfants": 1
    }
    """
    When method put
    Then status 200
    And match response.id == clientId
    And match response.nom == 'Dupont'
    And match response.prenom == 'Jean'
    And match response.situationFamiliale == 'DIVORCE'
    And match response.nombreEnfants == 1
    * print 'END ITCC-PUT-UC09 - Situation DIVORCE validée'

  @ITCC-PUT-UC10
  Scenario: ITCC-PUT-UC10 - PUT /v1/connaissance-clients/{id} - Situation familiale VEUF avec enfants
    * print 'ITCC-PUT-UC10 - PUT /v1/connaissance-clients/{id} - Modification VEUF'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And header X-Correlation-ID = 'test-correlation-veuf'
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue de la Paix",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "VEUF",
      "nombreEnfants": 3
    }
    """
    When method put
    Then status 200
    And match response.id == clientId
    And match response.nom == 'Dupont'
    And match response.prenom == 'Jean'
    And match response.situationFamiliale == 'VEUF'
    And match response.nombreEnfants == 3
    * print 'END ITCC-PUT-UC10 - Situation VEUF validée'

  @ITCC-PUT-UC11
  Scenario: ITCC-PUT-UC11 - PUT /v1/connaissance-clients/{id} - Changement de situation MARIE vers DIVORCE
    * print 'ITCC-PUT-UC11 - PUT /v1/connaissance-clients/{id} - MARIE vers DIVORCE'
    # D'abord mettre le client en MARIE
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue de la Paix",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "MARIE",
      "nombreEnfants": 2
    }
    """
    When method put
    Then status 200
    And match response.situationFamiliale == 'MARIE'
    
    # Puis passer à DIVORCE
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue de la Paix",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "DIVORCE",
      "nombreEnfants": 2
    }
    """
    When method put
    Then status 200
    And match response.situationFamiliale == 'DIVORCE'
    And match response.nombreEnfants == 2
    * print 'END ITCC-PUT-UC11 - Transition MARIE -> DIVORCE validée'

  @ITCC-PUT-UC12
  Scenario: ITCC-PUT-UC12 - PUT /v1/connaissance-clients/{id} - Situation familiale invalide (400)
    * print 'ITCC-PUT-UC12 - PUT /v1/connaissance-clients/{id} - Situation invalide'
    Given path '/v1/connaissance-clients/' + clientId
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    And request 
    """
    {
      "nom": "Dupont",
      "prenom": "Jean",
      "ligne1": "10 rue de la Paix",
      "codePostal": "75001",
      "ville": "Paris",
      "situationFamiliale": "PACSE",
      "nombreEnfants": 0
    }
    """
    When method put
    Then status 400
    And match response.status == 400
    * print 'END ITCC-PUT-UC12 - 400 vérifié (situation invalide PACSE)'
