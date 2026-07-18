import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!dbName) {
    throw new Error("Missing MONGODB_DB environment variable");
  }

  // Cache the promise on globalThis so it survives hot reloads in dev AND is
  // reused across invocations within the same serverless instance in production.
  if (!globalThis.__mongoClientPromise__) {
    const client = new MongoClient(uri);
    globalThis.__mongoClientPromise__ = client.connect();
  }

  const connectedClient = await globalThis.__mongoClientPromise__!;
  return connectedClient.db(dbName);
}
