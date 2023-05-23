import { Test, TestingModule } from "@nestjs/testing";
import { AmiDbService } from "./ami-db.service";
import { VersionService } from "../version/version.service";

describe("AmiDbService", () => {
  let service: AmiDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmiDbService, VersionService],
    }).compile();

    service = module.get<AmiDbService>(AmiDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should save a question", async () => {
    await service.saveQuestion({
      shown: 0,
      content: "hello",
      relatedAnswers: ["1", "2", "4"],
    });
  });

  it('should associate answers', async () => {
    await service.associateAnswerWithQuestion('64694d7ecc5c7f64de99e3f8', '64694c7afd546c3770d6fc92')
  })
});
