import { Injectable } from "@nestjs/common";
import { Answer, I_Answer } from "./models";
import { getLocalDbClient } from "../../shared/local-db/local-db";
import { ObjectId } from "mongodb";

@Injectable()
export class LocalAnswerDataService {
  dbName = "monster-agent";
  dataCollectionName = "answers";

  async vote(type: "up" | "down", id: string) {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const  _id  = new ObjectId(id)
    const seed = await collection.findOne<I_Answer>({ _id });
    const answer = new Answer(seed);
    answer.vote(type)
    const serializedAnswer = answer.serialize();
    await collection.updateOne({ _id }, { $set: serializedAnswer });
    const doc = await collection.findOne({ _id });
    client.close();
    return doc;
  }

  async set(relatedQuestion: string, content: string): Promise<Answer> {
    const client = getLocalDbClient();
    await client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const insertResult = await collection.insertOne({});
    const id = Answer.getIdFromInsertResult(insertResult);
    const answer = new Answer(id, relatedQuestion, content);
    const { _id } = answer;
    const serializedAnswer = answer.serialize();
    await collection.updateOne({ _id }, { $set: serializedAnswer });
    await client.close();
    return answer;
  }

  async delete(answer: Answer) {
    const {_id} = answer
    const client = getLocalDbClient();
    await client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    await collection.deleteOne({ _id });
    await client.close();
    return answer.id;
  }

  async getByIds(ids: Array<string>, minScore = 0): Promise<Array<Answer>> {
    const client = getLocalDbClient();
    await client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const answers = ids.map((id) => new ObjectId(id));
    const docs = await collection.find({
      _id: { $in: answers },
      score: { $gte: minScore },
    }).toArray();
    await client.close();
    return docs.map((d) => new Answer(d as any));
  }
}
