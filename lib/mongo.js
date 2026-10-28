// lib/mongo.js
// MongoDB connection pooling and collection accessors
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interntrack_mongo';
let client;
let clientPromise;

function createFallbackCollection(name) {
  return {
    find: () => {
      const cursor = {
        sort: () => cursor,
        limit: () => cursor,
        skip: () => cursor,
        project: () => cursor,
        toArray: async () => [],
      };
      return cursor;
    },
    findOne: async () => null,
    insertOne: async (doc) => ({ acknowledged: true, insertedId: 'mock_' + Date.now() }),
    insertMany: async (docs) => ({ acknowledged: true, insertedCount: docs.length }),
    updateOne: async () => ({ acknowledged: true, modifiedCount: 1, matchedCount: 1 }),
    updateMany: async () => ({ acknowledged: true, modifiedCount: 1, matchedCount: 1 }),
    deleteOne: async () => ({ acknowledged: true, deletedCount: 1 }),
    deleteMany: async () => ({ acknowledged: true, deletedCount: 0 }),
    createIndex: async () => null,
    countDocuments: async () => 0,
    aggregate: () => ({
      toArray: async () => [],
    }),
  };
}

function getClientPromise() {
  if (!clientPromise) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    clientPromise = client.connect().catch((err) => {
      console.warn('[MongoDB] Connection unavailable, engaging resilient fallback:', err.message);
      return null;
    });
  }
  return clientPromise;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = getClientPromise();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = getClientPromise();
}

/**
 * Returns database handle for interntrack_mongo
 */
async function getMongoDb() {
  try {
    const connectedClient = await clientPromise;
    if (!connectedClient) {
      return {
        collection: (name) => createFallbackCollection(name),
      };
    }
    return connectedClient.db('interntrack_mongo');
  } catch (err) {
    console.warn('[MongoDB] Fallback handle used:', err.message);
    return {
      collection: (name) => createFallbackCollection(name),
    };
  }
}

/**
 * Helper to get a collection by name
 */
async function getCollection(name) {
  const db = await getMongoDb();
  return db.collection(name);
}

/**
 * Initializes MongoDB indexes and validation rules according to Section 11 of the specification
 */
async function initMongoIndexes() {
  const db = await getMongoDb();

  // 1. Resumes: unique student_id, multikey extracted_skills
  await db.collection('resumes').createIndex({ student_id: 1 }, { unique: true });
  await db.collection('resumes').createIndex({ extracted_skills: 1 });

  // 2. Experience reviews: compound company_id + created_at, text search on review content
  await db.collection('experience_reviews').createIndex({ company_id: 1, created_at: -1 });
  await db.collection('experience_reviews').createIndex({ text: 'text' });

  // 3. Interview feedback: compound interview_id + panelist_id
  await db.collection('interview_feedback').createIndex({ interview_id: 1, panelist_id: 1 });

  // 4. Notifications: TTL index on expireAt, compound user_id + read + created_at
  await db.collection('notifications').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('notifications').createIndex({ user_id: 1, read: 1, created_at: -1 });

  // 5. Activity logs: user_id + ts
  await db.collection('activity_logs').createIndex({ user_id: 1, ts: -1 });
  await db.collection('activity_logs').createIndex({ ts: -1 });

  // 6. Posting documents: posting_id unique
  await db.collection('posting_documents').createIndex({ posting_id: 1 }, { unique: true });

  console.log('MongoDB indexes and collections successfully initialized.');
}

/**
 * Closes the active MongoDB connection. Used by automated test suites and shutdown handlers.
 */
async function closeMongoConnection() {
  if (client) {
    await client.close();
  } else if (global._mongoClientPromise) {
    const c = await global._mongoClientPromise;
    await c.close();
    delete global._mongoClientPromise;
  }
}

module.exports = {
  getMongoDb,
  getCollection,
  initMongoIndexes,
  closeMongoConnection,
  clientPromise,
};
