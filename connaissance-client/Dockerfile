FROM azul/zulu-openjdk:17-jdk-crac-latest

COPY tests/cert/ign-fr-chain.der /app/ign-fr-chain.der
RUN keytool -import -alias ign-fr-chain -keystore /opt/zulu17.48.15-ca-crac-jdk17.0.10-linux_x64/lib/security/cacerts -file /app/ign-fr-chain.der
COPY connaissance-client-app/target/connaissance-client-app-1.0.0-SNAPSHOT.jar /app/connaissance-client.jar

EXPOSE 8080
