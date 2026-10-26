// lib/mongo.js
// MongoDB connection pooling and collection accessors
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interntrack_mongo';
let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Returns database handle for interntrack_mongo
 */
async function getMongoDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db('interntrack_mongo');
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

module.exports = {
  getMongoDb,
  getCollection,
  initMongoIndexes,
  clientPromise,
};
