import { Test, TestingModule } from "@nestjs/testing";
import { LocalQuestionDataService } from "./local-question-data.service";
import { faker } from "@faker-js/faker";

const testAnswers = [
  "645d8600d672249cde1cf2c3",
  "645d8600d672249cde1cf2c4",
  "645d8600d672249cde1cf2c6",
  "645d8600d672249cde1cf2c5",
];

    async function createNewAnswer(service: LocalQuestionDataService) {
      const question = faker.lorem.words(Math.floor(Math.random() * 10));
      const content = faker.lorem.paragraphs(1);
      const res = await service.set(`${question}?`, content);
      return res;
    }

describe("LocalQuestionDataService", () => {
  let service: LocalQuestionDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalQuestionDataService],
    }).compile();

    service = module.get<LocalQuestionDataService>(LocalQuestionDataService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should set an answer", async () => {
    // const t = await createNewAnswer();
    // console.log(t);

    const _res = [1, 2, 3, 4].map(() => createNewAnswer(service));
    const res = await Promise.all(_res);
    console.log(res);
  });

  it("should upvote an answer", async () => {
    const res = await service.vote("up", testAnswers[0]);
    console.log(res);
  });

  it("should downvote an answer", async () => {
    const res = await service.vote("down", testAnswers[0]);
    console.log(res);
  });

  it("should find an answer by ids", async () => {
    const res = await service.getByIds(testAnswers);
    console.log(res);
  });

  it('should delete an item', async () => {
    const answer = await createNewAnswer(service);
    console.log(answer)
    await new Promise(r => setTimeout(r, 2_000))
    const res = await service.delete(answer);
    console.log(res);
  })
});
