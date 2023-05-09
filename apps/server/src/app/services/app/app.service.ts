import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }


  async testPupeteer() {
    const loader = new PuppeteerWebBaseLoader("https://www.tabnews.com.br/");
    const docs = await loader.load();
    return docs
  }
}
