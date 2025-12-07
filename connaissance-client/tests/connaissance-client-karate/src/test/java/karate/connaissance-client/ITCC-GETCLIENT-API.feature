Feature: Connaissnce Client Get

  Background:
    * url baseUrl
    * def signInKeycloak = callonce read('ITCC-000-AUTHENT.feature@use_user_1')
    * def jwtToken = signInKeycloak.response.access_token
    * def result = callonce read('ITCC-CREATE-API.feature@ITCC-CREATE-UC01')
    * def idClient = result.response.id

  @ITCC-GET-UC01
  Scenario: ITCC-GET-UC01 - Get /v1/connaissance-clients/{id} - ok
    * print 'ITCC-GET-UC01 - Get /v1/connaissance-clients/' + idClient + ' - ok'
    Given path '/v1/connaissance-clients/'+idClient
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    When method get
    Then status 200
    * match $ contains {id:"#notnull"}
    * print 'END ITCC-GET-UC01 - Get /v1/connaissance-clients' + idClient + ' - ok'
