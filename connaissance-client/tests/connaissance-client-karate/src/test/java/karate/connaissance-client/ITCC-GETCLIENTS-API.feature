Feature: Connaissnce Client Get

  Background:
    * url baseUrl
    * def signInKeycloak = callonce read('ITCC-000-AUTHENT.feature@use_user_1')
    * def jwtToken = signInKeycloak.response.access_token

  @ITCC-GET-UC01
  Scenario: ITCC-GET-UC01 - Get /v1/connaissance-clients/ - ok
    * print 'ITCC-GET-UC01 - Get /v1/connaissance-clients/ - ok'
    Given path '/v1/connaissance-clients/'
    And header Accept = 'application/json'
    And header Authorization = 'Bearer ' + jwtToken
    When method get
    Then status 200
    * print 'END ITCC-GET-UC01 - Get /v1/connaissance-clients - ok'
