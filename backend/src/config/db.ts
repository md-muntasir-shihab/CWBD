import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/campusway';

async function ensureCriticalIndexes(): Promise<void> {
    const db = mongoose.connection;
    if (!db.db) return;

    try {
        const collection = db.db.collection('student_results');
        const indexes = await collection.indexes();
        const legacyUnique = indexes.find((idx) =>
            idx.name === 'exam_1_student_1'
            && idx.unique === true
            && idx.key?.exam === 1
            && idx.key?.student === 1
        );

        if (legacyUnique) {
            await collection.dropIndex('exam_1_student_1');
            console.log('[db] Dropped legacy index student_results.exam_1_student_1');
        }

        const hasCurrentUnique = indexes.some((idx) =>
            idx.unique === true
            && idx.key?.exam === 1
            && idx.key?.student === 1
            && idx.key?.attemptNo === 1
        );

        if (!hasCurrentUnique) {
            await collection.createIndex(
                { exam: 1, student: 1, attemptNo: 1 },
                { unique: true, name: 'exam_1_student_1_attemptNo_1' }
            );
            console.log('[db] Ensured index student_results.exam_1_student_1_attemptNo_1');
        }

        const users = db.db.collection('users');
        await Promise.all([
            users.createIndex({ email: 1 }, { unique: true, name: 'email_1' }),
            users.createIndex({ username: 1 }, { unique: true, name: 'username_1' }),
        ]);

        const exams = db.db.collection('exam_collection');
        await exams.createIndex({ share_link: 1 }, { sparse: true, unique: true, name: 'share_link_1' });

        const payments = db.db.collection('manual_payments');
        await Promise.all([
            payments.createIndex({ reference: 1 }, { sparse: true, name: 'reference_1' }),
            payments.createIndex({ date: -1 }, { name: 'date_-1' }),
        ]);
    } catch (error) {
        console.error('[db] Failed to ensure critical indexes:', error);
    }
}

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[db] MongoDB connected successfully');
        await ensureCriticalIndexes();
    } catch (error) {
        console.error('[db] MongoDB connection error:', error);
        process.exit(1);
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB error:', err);
});
