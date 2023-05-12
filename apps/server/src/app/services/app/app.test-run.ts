import { getService } from "../../../testing/get-service";
import { getLocalDbClient } from "../../shared/local-db/local-db";
import { AppService } from "./app.service";
import {ObjectId} from "mongodb"

(async () => {
  await testy();
})();

async function testy() {
  const client = getLocalDbClient("verbose");
  await client.connect();
  const db =  client.db("test::question-data");
  const _id = new ObjectId('645bec1eca5c89222dc2d6a5')
  const cursor = db.collection("questions").find({_id})
  const tput = await cursor.toArray()
  console.log(tput);
  client.close();

  //await db.collection("questions").insertOne({name: 'test', date: new Date()})

  // const service = await getService<AppService>(AppService)
  // const testResults = service.vectorTests()
}
