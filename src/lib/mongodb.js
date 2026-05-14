import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  // Keep the connection pool small per serverless instance so Vercel
  // doesn't blow past Atlas's connection limit on a free tier (~500
  // connections cluster-wide).
  maxPoolSize: 10,
  minPoolSize: 0,
  // Fail fast instead of hanging when the cluster is paused or has no
  // available primary. This lets API routes return a 5xx instead of timing
  // out at the platform level.
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 30000,
};

// Cache the client promise on the Node.js global so warm serverless
// instances reuse the same connection across requests. Without this, in
// production every module load created a brand-new MongoClient, which on
// Atlas free tier quickly exhausts connections and triggers
// MongoServerSelectionError: ReplicaSetNoPrimary.
let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
