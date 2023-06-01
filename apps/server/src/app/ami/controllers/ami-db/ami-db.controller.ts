import { Body, Controller, Get } from '@nestjs/common';
import { AmiDbService } from '../../ai-backend/services/ami-db/ami-db.service';
import { I_Question } from '../../models';

@Controller('ami-db')
export class AmiDbController {
  constructor(private db: AmiDbService) {}

  @Get('save-question')
  saveQuestion(@Body('question') question: Omit<I_Question, 'id'>) {
    //return this.db.saveQuestion(question);
  }
}
