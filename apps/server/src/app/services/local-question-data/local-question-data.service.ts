import { Injectable } from '@nestjs/common';
import {I_Question, Question} from "./models"
import {getLocalDbClient} from "../../shared/local-db/local-db"
import { ObjectId } from 'mongodb';



@Injectable()
export class LocalQuestionDataService {
  dbName = "monster-agent";
  dataCollectionName = "questions";

async set(questionText: string, answerId: string) {
    const client = getLocalDbClient();
    await client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const insertResult = await collection.insertOne({});
    const id = Question.getIdFromInsertResult(insertResult);
    const question = new Question(id, questionText);
    question.addAnswer(answerId)
    const { _id } = question.metadata;
    const serializedQuestion = question.serialize();
    await collection.updateOne({ _id }, { $set: serializedQuestion });
    await client.close();
    return question;
  }

  async getTrainingSet() {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const cursor =  collection.find({})
    const questions = await cursor.toArray();
    await client.close();
    return questions;
  }

  async updateUsed(questionId: string) {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const _id = new ObjectId(questionId);
    const questionSeed = await collection.findOne<I_Question>({_id})
    const question = new Question(questionSeed)
    question.updateUsed()
    const serializedQuestion = question.serialize();
    await collection.updateOne({ _id }, { $set: serializedQuestion });
    await client.close();
    return question;
  }

  async delete(questionId: string) {
    const client = getLocalDbClient();
    await client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const _id = new ObjectId(questionId);
    await collection.deleteOne({ _id });
    await client.close();
    return questionId;
  }

  async groupTo(centroidQuestionId: string, toCondenseIds: Array<string>) {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const _id = new ObjectId(centroidQuestionId);
    const questionSeed = await collection.findOne<I_Question>({_id})
    const question = new Question(questionSeed)
    const _toCondenseIds = toCondenseIds.map(id => new ObjectId(id))
    const toCondenseSeeds = await collection.find<I_Question>({_id: {$in: _toCondenseIds}}).toArray()
    const toCondense = toCondenseSeeds.map(seed => new Question(seed))
    const resetQuestions = toCondense.map(d => {
      d.metadata.relatedAnswers = question.metadata.relatedAnswers
      return d
    })
    await collection.bulkWrite(resetQuestions.map())
     
    
    
  }

 async addAnswer(questionId: string, answerId: string) {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const _id = new ObjectId(questionId);
    const questionSeed = await collection.findOne<I_Question>({_id})
    const question = new Question(questionSeed)
    question.addAnswer(answerId)
    const serializedQuestion = question.serialize();
    await collection.updateOne({ _id }, { $set: serializedQuestion });
    await client.close();
    return question;
  }

 async removeAnswer(questionId: string, answerId: string) {
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(this.dataCollectionName);
    const _id = new ObjectId(questionId);
    const questionSeed = await collection.findOne<I_Question>({_id})
    const question = new Question(questionSeed)
    question.removeAnswer(answerId)
    const serializedQuestion = question.serialize();
    await collection.updateOne({ _id }, { $set: serializedQuestion });
    client.close();
    return question;
  }
}
