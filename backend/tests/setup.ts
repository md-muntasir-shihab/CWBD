import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
        dbName: 'campusway-home-tests',
    });
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    const cleanupPromises: Promise<unknown>[] = [];
    for (const key of Object.keys(collections)) {
        cleanupPromises.push(collections[key].deleteMany({}));
    }
    await Promise.all(cleanupPromises);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
