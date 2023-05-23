import { Test, TestingModule } from '@nestjs/testing';
import { AnswerTrainingService } from './answer-training.service';

describe('AnswerTrainingService', () => {
  let service: AnswerTrainingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerTrainingService],
    }).compile();

    service = module.get<AnswerTrainingService>(AnswerTrainingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
