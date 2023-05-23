import { Injectable } from '@nestjs/common';
import { I_Version } from '../../../models';

@Injectable()
export class AnswerTrainingService {
  async train(id: string, version: Omit<I_Version, 'id'>) {
    
  }
}
