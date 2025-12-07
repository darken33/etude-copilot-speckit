#!/bin/bash

java -Dspring.context.checkpoint=onRefresh -XX:CRaCCheckpointTo=/crac -jar /app/connaissance-client.jar
#java -XX:CRaCCheckpointTo=/crac -jar /app/connaissance-client.jar&
#sleep 60
#jcmd /app/connaissance-client.jar JDK.checkpoint
#sleep 10