import { initInMemoryMongo, clearDatabase, stopInMemoryMongo } from '../__helpers__/db';

beforeAll(async () => {
    process.env.TZ = 'UTC';
    // No need to set MONGO_URI because tests do not use src/index.ts.
    await initInMemoryMongo();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await stopInMemoryMongo();
});
