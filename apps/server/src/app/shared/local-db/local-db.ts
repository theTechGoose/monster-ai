import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";



export function getLocalDbClient(type: 'silent' | 'verbose' = 'silent') {
  const uri =
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktweyc3.mongodb.net/?retryWrites=true&w=majority`;
  if(type === 'verbose') {
  console.log(`ntfy: ${uri}`);
  }
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  return client;

}
