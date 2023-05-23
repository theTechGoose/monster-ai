import { Test, TestingModule } from "@nestjs/testing";
import { TrainingDataService } from "./training-data.service";
import { AmiDbService } from "../services/ami-db/ami-db.service";
import { TrainingManagerService } from "../services/training-manager/training-manager.service";

describe("TrainingDataService", () => {
  let service: TrainingDataService;
  let fakeDbService = {} as any;
  let fakeManagerService = {} as any;

  beforeEach(async () => {
    fakeDbService = {
      vote: jest.fn((id, type) => {
        if (type === "up") return { success: true, type: "up" };
        return { success: true, type: "down" };
      }),
      getAll: jest.fn((type) => []),
    };

    fakeManagerService = {
      train: jest.fn((arg, version) => {
        return {
          type: arg,
          id: "t",
        };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingDataService, {
        provide: AmiDbService,
        useValue: fakeDbService,
      }, {
          provide: TrainingManagerService,
          useValue: fakeManagerService,
        }],
    }).compile();

    service = module.get<TrainingDataService>(TrainingDataService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should upvote", () => {
    service.upVote("t");
    expect(fakeDbService.vote).toHaveBeenCalledWith("t", "up");
    expect(fakeDbService.vote).toHaveReturnedWith({
      success: true,
      type: "up",
    });
  });

  it("should upvote", () => {
    service.downVote("t");
    expect(fakeDbService.vote).toHaveBeenCalledWith("t", "down");
    expect(fakeDbService.vote).toHaveReturnedWith({
      success: true,
      type: "down",
    });
  });

  it("should train", async () => {
    await service.train("answer");
    expect(fakeManagerService.train).toHaveBeenCalledWith("answer", {
      answers: [],
      questions: [],
    });
    expect(fakeManagerService.train).toHaveReturnedWith({
      type: "answer",
      id: "t",
    });
  });
});
