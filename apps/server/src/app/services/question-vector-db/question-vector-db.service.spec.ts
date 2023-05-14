import { Test, TestingModule } from '@nestjs/testing';
import { QuestionVectorDbService } from './question-vector-db.service';

describe('QuestionVectorDbService', () => {
  let service: QuestionVectorDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionVectorDbService],
    }).compile();

    service = module.get<QuestionVectorDbService>(QuestionVectorDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
