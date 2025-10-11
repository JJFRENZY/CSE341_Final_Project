import { MongoClient, ServerApiVersion } from 'mongodb';

let client;
let db;

export const connectToDb = async (uri, dbName) => {
  if (!uri) throw new Error('MONGODB_URI missing');
  if (!dbName) throw new Error('DB_NAME missing');
  if (db) return db;

  client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  console.log('🔌 Connecting to MongoDB…');
  await client.connect();
  await client.db('admin').command({ ping: 1 });
  db = client.db(dbName);
  console.log(`✅ Connected: ${db.databaseName}`);

  const shutdown = async (signal) => {
    try {
      console.log(`\n🔻 ${signal} received. Closing Mongo client…`);
      await client.close();
      console.log('👋 Mongo client closed.');
    } catch (e) {
      console.error('Error closing Mongo client:', e);
    } finally {
      process.exit(0);
    }
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return db;
};

export const getDb = () => {
  if (!db) throw new Error('DB not initialized. Call connectToDb first.');
  return db;
};
