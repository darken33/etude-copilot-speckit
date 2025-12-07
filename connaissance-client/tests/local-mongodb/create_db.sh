#!/bin/sh
docker run --name local-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongoadmin -e MONGO_INITDB_ROOT_PASSWORD=secret -d mongo
echo COSMOSDB_DATABASE_NAME=admin
echo COSMOSDB_CONNECTION_STRING=mongodb://mongoadmin:secret@0.0.0.0:27017
