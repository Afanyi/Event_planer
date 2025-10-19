import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function initInMemoryMongo() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    return uri;
}

export async function stopInMemoryMongo() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
    mongod = null;
}

export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const name of Object.keys(collections)) {
        await collections[name].deleteMany({});
    }
}
