#!/bin/sh
docker start local-keycloak
echo KEYCLOAK_USER=admin
echo KEYCLOAK_PASSWORD=secret
