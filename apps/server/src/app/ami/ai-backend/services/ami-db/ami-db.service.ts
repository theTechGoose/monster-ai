import { Injectable } from '@nestjs/common';
import { VersionService } from '../version/version.service';
import { I_Question, I_Answer, T_TrainingArg } from '../../../models';
import { getLocalDbClient } from '../../../../shared/local-db/local-db';
import { ObjectId } from 'mongodb';

@Injectable()
export class AmiDbService {
  constructor(private version:VersionService) { }

  async vote(id: string, vote: 'up' | 'down') {
    const collection = await this.getCollection('answer')
    const _id = new ObjectId(id);
    const upVotes = vote === 'up' ? 1 : -1;
    const response = await collection.updateOne({_id}, {$inc: {upVotes}})
    return {success: response.acknowledged, type: vote}
  }

  async saveQuestion(question: Omit<I_Question, 'id'>) {
    const collection = await this.getCollection('question')
    const _id = new ObjectId();
    const response = await collection.insertOne({_id, ...question})
    return {success: response.acknowledged}
  }

  async saveAnswer(answer: Omit<I_Answer, 'id'>) {
    const collection = await this.getCollection('answer')
    const _id = new ObjectId();
    const response = await collection.insertOne({_id, ...answer})
    return {success: response.acknowledged}
  }

  async associateAnswerWithQuestion(questionId: string, answerId: string) {
    const collection = await this.getCollection('question')
    const _id = new ObjectId(questionId);
    const response = await collection.updateOne({_id}, {$push: {relatedAnswers: answerId}})
    return {success: response.acknowledged}
  }

  async getAnswers(ids: Array<string>){
    const collection = await this.getCollection('answer')
    const _ids = ids.map(id => new ObjectId(id))
    const response = collection.find({_id: {$in: _ids}})
    return response.toArray()
  }

  async getQuestions(ids: Array<string>){
    const collection = await this.getCollection('question')
    const _ids = ids.map(id => new ObjectId(id))
    const response = collection.find({_id: {$in: _ids}})
    return response.toArray()
  }

  async getAll<T>(arg: T_TrainingArg){
    const collection = await this.getCollection(arg)
    const response = collection.find({})
    return await response.toArray() as Array<T>
  }

  private async getCollection(arg: T_TrainingArg) {
    const version = await this.version.getCurrentVersion(arg)
    const client = getLocalDbClient();
    client.connect();
    const db = client.db(arg);
    return db.collection(version);
  }
}
