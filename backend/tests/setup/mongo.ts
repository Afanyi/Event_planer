import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connect } from '../../src/db';

let mongod: MongoMemoryServer;

export async function startTestMongo() {
    mongod = await MongoMemoryServer.create({
        instance: { storageEngine: 'wiredTiger' } // „echter“ mongod
    });
    const uri = mongod.getUri();
    await connect(uri);
    return uri;
}

export async function stopTestMongo() {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.connection.close().catch(() => {});
    if (mongod) await mongod.stop();
}

/** Alle Collections nach JEDEM Test leeren, damit die Tests unabhängig sind */
export async function clearDatabase() {
    const { collections } = mongoose.connection;
    const tasks = Object.values(collections).map((c) => c.deleteMany({}));
    await Promise.all(tasks);
}
