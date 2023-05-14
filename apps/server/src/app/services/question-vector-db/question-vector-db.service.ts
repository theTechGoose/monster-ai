import { Injectable } from '@nestjs/common';
import { findPackageJsonDir } from '../../shared/find-root/find-root';
import { Question } from '../local-question-data/models';
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';


 const embeddings = new OpenAIEmbeddings({openAIApiKey: process.env.OPEN_AI_KEY})

@Injectable()
export class QuestionVectorDbService {
  root = null as any
  route = 'stores/questions'

  get finalPath() {
    return `${this.root}/${this.route}`
  }

  constructor() {
    this.root = findPackageJsonDir()
  }

  async saveQuestionVector(questions: Array<Question>) {
    const store =  await HNSWLib.fromDocuments(questions, embeddings)
    await store.save(this.finalPath)
  }

   loadQuestionVector() {
    return  HNSWLib.load(this.finalPath, embeddings)
  }
  

  async queryQuestionVector(query: string, k: number){
    const store = await this.loadQuestionVector()
    const results = await store.similaritySearchWithScore(query, k)
    return results.map(([doc, score]) => {
      return {
        content: doc.metadata,
        debug: doc.pageContent,
        score
      }
    })
  }
}
