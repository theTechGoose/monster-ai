import { Module } from '@nestjs/common';

import { AppController } from './controllers/app/app.controller';
import { AppService } from './services/app/app.service';
import {BrittanicaService} from "./services/brittanica/brittanica.service"
import {LocalAnswerDataService} from "./services/local-answer-data/local-answer-data.service"
import {LocalQuestionDataService} from "./services/local-question-data/local-question-data.service"
import {QuestionVectorDbService} from "./services/question-vector-db/question-vector-db.service"
import {SupportingDocumentsService} from "./services/supporting-documents/supporting-documents.service"


export const providers = [AppService, BrittanicaService, LocalAnswerDataService,LocalQuestionDataService,QuestionVectorDbService,SupportingDocumentsService]


@Module({
  imports: [],
  controllers: [AppController],
  providers,
})

export class AppModule {}
