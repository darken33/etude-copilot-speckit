package com.sqli.workshop.ddd.connaissance.client.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;

@Configuration
@PropertySource(value = "application.yml") 
/**
 * DatabaseConfiguration - TODO: description
 *
 * @todo Add detailed Javadoc
 */
public class DatabaseConfiguration {

    @Value("${spring.data.mongodb.uri}")
    String uri;

 	@Bean
	MongoClient mongoClient(MongoClientSettings settings) {
		return new MongoClientWrapper(settings);
	}


	@Bean
	MongoClientSettings settings() {
		return MongoClientSettings.builder().applyConnectionString(new ConnectionString(uri)).build();
	}

}