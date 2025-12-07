#!/bin/sh
docker start local-mongo
echo COSMOSDB_DATABASE_NAME=admin
echo COSMOSDB_CONNECTION_STRING=mongodb://mongoadmin:secret@0.0.0.0:27017
