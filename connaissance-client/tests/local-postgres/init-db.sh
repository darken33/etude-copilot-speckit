#!/bin/sh

echo "recupérer le chemin courant"
dbpath=`pwd`

echo "arrêter le container local-postgres"
docker stop local-postgres

echo "supprimer le container local-postgres"
docker rm local-postgres

echo "recréer le répertoir pour les data" 
if [ -d data ] 
then
  sudo rm -rf data
fi  
mkdir data

echo "créer et exécuter le container docker local-postgres (posgres:9.5)"
docker run --name local-postgres -v $dbpath/data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=admin -p 5432:5432 -h local-postgres -d postgres:9.5

echo "créer la base de données bitnami_keycloak"
sleep 20
docker exec -it -u postgres local-postgres psql -c 'create database bitnami_keycloak'

echo "initialisation terminée"
