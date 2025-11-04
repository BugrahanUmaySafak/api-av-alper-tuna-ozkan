// src/db/mongoClient.ts
import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';


declare global {
// eslint-disable-next-line no-var
var __mongoClientPromise: Promise<MongoClient> | undefined;
}


export function getMongoClient(): Promise<MongoClient> {
if (!global.__mongoClientPromise) {
const client = new MongoClient(env.mongoUri, {
maxPoolSize: 5,
minPoolSize: 0,
serverSelectionTimeoutMS: 5000,
});
global.__mongoClientPromise = client.connect();
}
return global.__mongoClientPromise;
}