import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";

import { Injectable } from "@nestjs/common";

import { Document } from "langchain/document";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { faker } from "@faker-js/faker";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPEN_AI_KEY,
});

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: "Hello API" };
  }

  async testPupeteer() {
    const loader = new PuppeteerWebBaseLoader("https://www.tabnews.com.br/");
    const docs = await loader.load();
    return docs;
  }

  async vectorTests() {
    const docs = [];
    for (let i = 0; i < 50; i++) {
      const doc = new Document({
        pageContent:  faker.company.name()+ ' ' + faker.company.catchPhrase(),
        metadata: {
          url: faker.internet.url(),
          answers: [
            {
              content: faker.lorem.sentence(10),
              upvotes: faker.datatype.number(100),
              downvotes: faker.datatype.number(100),
            },
            {
              content: faker.lorem.sentence(10),
              upvotes: faker.datatype.number(100),
              downvotes: faker.datatype.number(100),
            },
            {
              content: faker.lorem.sentence(10),
              upvotes: faker.datatype.number(100),
              downvotes: faker.datatype.number(100),
            },
          ],
        },
      });
      docs.push(doc);
    }

    const store = await HNSWLib.fromDocuments(docs, embeddings);
    const q1 = await store.similaritySearchWithScore(docs[0].pageContent, 3);
    const q2 = await store.similaritySearchWithScore(docs[1].pageContent, 3);
    const q3 = await store.similaritySearchWithScore(docs[2].pageContent, 3);
    console.log(docs[0].pageContent);
    console.log("-------answers------");
    q1.forEach(doc => {
      console.log('::::::::answer loop start:::::::::');
      console.log(doc[0].pageContent)
      console.log(doc[0].metadata)
      console.log(Number(doc[1]).toFixed(4))
      console.log('::::::::END:::::::::');
    })
    console.log("**************************************");
    console.log(docs[1].pageContent);
    console.log("-------------");
    q2.forEach(doc => {
      console.log('::::::::answer loop start:::::::::');
      console.log(doc[0].pageContent)
      console.log(doc[0].metadata)
      console.log(Number(doc[1]).toFixed(4))
      console.log('::::::::END:::::::::');
    })
    console.log("**************************************");
    console.log(docs[2].pageContent);
    console.log("-------------");
    q3.forEach(doc => {
      console.log('::::::::answer loop start:::::::::');
      console.log(doc[0].pageContent)
      console.log(doc[0].metadata)
      console.log(Number(doc[1]).toFixed(4))
      console.log('::::::::END:::::::::');
    })
  }



}
