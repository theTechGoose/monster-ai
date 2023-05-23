import { Test, TestingModule } from '@nestjs/testing';
import { QuestionTrainingService } from './question-training.service';

describe('QuestionTrainingService', () => {
  let service: QuestionTrainingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionTrainingService],
    }).compile();

    service = module.get<QuestionTrainingService>(QuestionTrainingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
