import { Injectable } from '@nestjs/common';
import { I_Version } from '../../../models';

@Injectable()
export class QuestionTrainingService {
  
  async train(id: string, version: Omit<I_Version, 'id'>) {}
}
