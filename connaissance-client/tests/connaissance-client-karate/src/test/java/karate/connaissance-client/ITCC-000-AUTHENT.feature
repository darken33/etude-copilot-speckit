@IGNORE
Feature: Reusable Keycloak Autentication

  @use_user_1
  Scenario:
    Given url authUrl
    And form field client_id = clientId
    And form field client_secret = clientSecret
    And form field grant_type = 'password'
    And form field username = userName
    And form field password = password
    And form field scope = 'openid'
    And header Content-Type = 'application/x-www-form-urlencoded'
    When method POST
    Then status 200
