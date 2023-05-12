import { Test, TestingModule } from '@nestjs/testing';
import {faker} from "@faker-js/faker"
import { LocalQuestionDataService } from './local-question-data.service';

const testId = '645e62551b615bd95d9fb0ff'

describe('LocalQuestionDataService', () => {
  let service: LocalQuestionDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalQuestionDataService],
    }).compile();

    service = module.get<LocalQuestionDataService>(LocalQuestionDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set questions in the db', async() => {
    const questionText = faker.lorem.sentence() + '?'
    const answerId = faker.git.commitSha();
    const res = await service.set(questionText, answerId)
    console.log(res)
  })

  it('should add answers to questions', async () => {
    const answerId = faker.git.commitSha();
    const res = await service.addAnswer(testId, answerId)
    console.log(res)
  })

  it('should remove answers to questions', async () => {
    const answerId = faker.git.commitSha();
    const res = await service.addAnswer(testId, answerId)
    const res2 = await service.removeAnswer(testId, answerId)
    console.log({ res2, res })
  })

  it('should delete a question', async () => {
    const questionText = faker.lorem.sentence() + '?'
    const answerId = faker.git.commitSha();
    const res = await service.set(questionText, answerId)
    console.log(res)
    const res2 = await service.delete(res.metadata.id)
    console.log({res, res2});
  })

  it('should update the amount of times used', async () => {
    const res = await service.updateUsed(testId)
    console.log(res);
  })

  it('should pull the entire training set', async () => {
    const res = await service.getTrainingSet()
    console.log(res);
  })
});
