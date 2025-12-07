package com.sqli.workshop.ddd.connaissance.client.config;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.conversions.Bson;
import org.crac.Context;
import org.crac.Resource;
import org.springframework.context.SmartLifecycle;

import com.mongodb.ClientSessionOptions;
import com.mongodb.MongoClientSettings;
import com.mongodb.ReadConcern;
import com.mongodb.ReadPreference;
import com.mongodb.WriteConcern;
import com.mongodb.client.ChangeStreamIterable;
import com.mongodb.client.ClientSession;
import com.mongodb.client.ListDatabasesIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;
import com.mongodb.client.model.bulk.ClientBulkWriteOptions;
import com.mongodb.client.model.bulk.ClientBulkWriteResult;
import com.mongodb.client.model.bulk.ClientNamespacedWriteModel;
import com.mongodb.connection.ClusterDescription;

/**
 * MongoClientWrapper - TODO: description
 *
 * @todo Add detailed Javadoc
 */
public class MongoClientWrapper implements MongoClient, SmartLifecycle, Resource {

    MongoClientSettings settings;
    MongoClient delegate;

    public MongoClientWrapper(MongoClientSettings settings) {
        this.settings = settings;
    }

    @Override
/**
 * getDatabase() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public MongoDatabase getDatabase(String databaseName) {
        return delegate.getDatabase(databaseName);
    }

    @Override
/**
 * startSession() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * startSession() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * startSession - TODO: description
 *
 * @return TODO
 */
    public ClientSession startSession() {
        return delegate.startSession();
    }

    @Override
    public ClientSession startSession(ClientSessionOptions options) {
        return delegate.startSession(options);
    }

    @Override
/**
 * close() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public void close() {
        if(delegate != null) {
            delegate.close();
        }
    }

    @Override
/**
 * listDatabaseNames() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * listDatabaseNames() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * listDatabaseNames - TODO: description
 *
 * @return TODO
 */
    public MongoIterable<String> listDatabaseNames() {
        return delegate.listDatabaseNames();
    }

    @Override
    public MongoIterable<String> listDatabaseNames(ClientSession clientSession) {
        return delegate.listDatabaseNames(clientSession);
    }

    @Override
/**
 * listDatabases() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * listDatabases() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * listDatabases - TODO: description
 *
 * @return TODO
 */
    public ListDatabasesIterable<Document> listDatabases() {
        return delegate.listDatabases();
    }

    @Override
    public ListDatabasesIterable<Document> listDatabases(ClientSession clientSession) {
        return delegate.listDatabases(clientSession);
    }

    @Override
    public <TResult> ListDatabasesIterable<TResult> listDatabases(Class<TResult> tResultClass) {
        return delegate.listDatabases(tResultClass);
    }

    @Override
    public <TResult> ListDatabasesIterable<TResult> listDatabases(ClientSession clientSession, Class<TResult> tResultClass) {
        return delegate.listDatabases(clientSession, tResultClass);
    }

    @Override
/**
 * watch() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * watch() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * watch() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * watch() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
/**
 * watch - TODO: description
 *
 * @return TODO
 */
/**
 * watch - TODO: description
 *
 * @return TODO
 */
/**
 * watch - TODO: description
 *
 * @return TODO
 */
    public ChangeStreamIterable<Document> watch() {
        return delegate.watch();
    }

    @Override
    public <TResult> ChangeStreamIterable<TResult> watch(Class<TResult> tResultClass) {
        return delegate.watch(tResultClass);
    }

    @Override
    public ChangeStreamIterable<Document> watch(List<? extends Bson> pipeline) {
        return delegate.watch(pipeline);
    }

    @Override
    public <TResult> ChangeStreamIterable<TResult> watch(List<? extends Bson> pipeline, Class<TResult> tResultClass) {
        return delegate.watch(pipeline, tResultClass);
    }

    @Override
    public ChangeStreamIterable<Document> watch(ClientSession clientSession) {
        return delegate.watch(clientSession);
    }

    @Override
    public <TResult> ChangeStreamIterable<TResult> watch(ClientSession clientSession, Class<TResult> tResultClass) {
        return delegate.watch(clientSession, tResultClass);
    }

    @Override
    public ChangeStreamIterable<Document> watch(ClientSession clientSession, List<? extends Bson> pipeline) {
        return delegate.watch(clientSession, pipeline);
    }

    @Override
    public <TResult> ChangeStreamIterable<TResult> watch(ClientSession clientSession, List<? extends Bson> pipeline, Class<TResult> tResultClass) {
        return delegate.watch(clientSession, pipeline, tResultClass);
    }

    @Override
/**
 * getClusterDescription() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public ClusterDescription getClusterDescription() {
        return delegate.getClusterDescription();
    }

    @Override
/**
 * withTimeout() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public MongoClient withTimeout(long timeout, TimeUnit timeUnit) {
        MongoClientWrapper wrapper = new MongoClientWrapper(settings);
        wrapper.delegate = (MongoClient) delegate.withTimeout(timeout, timeUnit);
        return wrapper;
    }

    @Override
/**
 * getCodecRegistry() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public CodecRegistry getCodecRegistry() {
        return delegate.getCodecRegistry();
    }

    @Override
/**
 * getReadPreference() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public ReadPreference getReadPreference() {
        return delegate.getReadPreference();
    }

    @Override
/**
 * getWriteConcern() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public WriteConcern getWriteConcern() {
        return delegate.getWriteConcern();
    }

    @Override
/**
 * getReadConcern() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public ReadConcern getReadConcern() {
        return delegate.getReadConcern();
    }

    @Override
/**
 * getTimeout() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public Long getTimeout(TimeUnit timeUnit) {
        return delegate.getTimeout(timeUnit);
    }

    @Override
/**
 * withCodecRegistry() - TODO: description
 *
 * @todo Add detailed Javadoc
 */
    public MongoClient withCodecRegistry(CodecRegistry codecRegistry) {
        MongoClientWrapper wrapper = new MongoClientWrapper(settings);
        wrapper.delegate = (MongoClient) delegate.withCodecRegistry(codecRegistry);
        return wrapper;
    }

    @Override
/**
 * withReadPreference - TODO: description
 *
 * @param readPreference TODO
 * @return TODO
 */
    public MongoClient withReadPreference(ReadPreference readPreference) {
        MongoClientWrapper wrapper = new MongoClientWrapper(settings);
        wrapper.delegate = (MongoClient) delegate.withReadPreference(readPreference);
        return wrapper;
    }

    @Override
/**
 * withWriteConcern - TODO: description
 *
 * @param writeConcern TODO
 * @return TODO
 */
    public MongoClient withWriteConcern(WriteConcern writeConcern) {
        MongoClientWrapper wrapper = new MongoClientWrapper(settings);
        wrapper.delegate = (MongoClient) delegate.withWriteConcern(writeConcern);
        return wrapper;
    }

    @Override
/**
 * withReadConcern - TODO: description
 *
 * @param readConcern TODO
 * @return TODO
 */
    public MongoClient withReadConcern(ReadConcern readConcern) {
        MongoClientWrapper wrapper = new MongoClientWrapper(settings);
        wrapper.delegate = (MongoClient) delegate.withReadConcern(readConcern);
        return wrapper;
    }

    @Override
/**
 * bulkWrite - TODO: description
 *
 * @param clientSession TODO
 * @param requests TODO
 * @param options TODO
 * @return TODO
 */
/**
 * bulkWrite - TODO: description
 *
 * @param clientSession TODO
 * @param requests TODO
 * @param options TODO
 * @return TODO
 */
/**
 * bulkWrite - TODO: description
 *
 * @param clientSession TODO
 * @param requests TODO
 * @param options TODO
 * @return TODO
 */
/**
 * bulkWrite - TODO: description
 *
 * @param clientSession TODO
 * @param requests TODO
 * @param options TODO
 * @return TODO
 */
    public ClientBulkWriteResult bulkWrite(ClientSession clientSession, List<? extends ClientNamespacedWriteModel> requests, ClientBulkWriteOptions options) {
        return delegate.bulkWrite(clientSession, requests, options);
    }

    @Override
    public ClientBulkWriteResult bulkWrite(List<? extends ClientNamespacedWriteModel> requests, ClientBulkWriteOptions options) {
        return delegate.bulkWrite(requests, options);
    }

    @Override
    public ClientBulkWriteResult bulkWrite(ClientSession clientSession, List<? extends ClientNamespacedWriteModel> requests) {
        return delegate.bulkWrite(clientSession, requests);
    }

    @Override
    public ClientBulkWriteResult bulkWrite(List<? extends ClientNamespacedWriteModel> requests) {
        return delegate.bulkWrite(requests);
    }

    @Override
/**
 * start - TODO: description
 *
 */
    public void start() {
        this.delegate = MongoClients.create(settings);
    }

    @Override
/**
 * stop - TODO: description
 *
 */
    public void stop() {
        this.delegate.close();
        this.delegate = null;
    }

    @Override
/**
 * isRunning - TODO: description
 *
 * @return TODO
 */
    public boolean isRunning() {
        return delegate != null;
    }

    @Override
/**
 * beforeCheckpoint - TODO: description
 *
 * @param context TODO
 */
    public void beforeCheckpoint(Context<? extends Resource> context) throws Exception {
        stop();
    }

    @Override
/**
 * afterRestore - TODO: description
 *
 * @param context TODO
 */
    public void afterRestore(Context<? extends Resource> context) throws Exception {
        start();
    }
}