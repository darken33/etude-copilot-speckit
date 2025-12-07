#!/bin/sh
docker run --name local-keycloak -p 8090:8080 -e KEYCLOAK_DATABASE_HOST=local-postgres -e KEYCLOAK_DATABASE_USER=postgres -e KEYCLOAK_DATABASE_PASSWORD=admin --link local-postgres:local-psotgres -d bitnami/keycloak
