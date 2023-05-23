import { Test, TestingModule } from "@nestjs/testing";
import { TrainingManagerService } from "./training-manager.service";
import { VersionService } from "../version/version.service";
import { AmiBrittanicaService } from "../ami-brittanica/ami-brittanica.service";
import { AnswerTrainingService } from "../answer-training/answer-training.service";
import { QuestionTrainingService } from "../question-training/question-training.service";

describe("TrainingManagerService", () => {
  let service: TrainingManagerService;
  let fakeVersionService: any;
  let fakeVBrittanicatService: any;
  let fakeAnswerTrainingService: any;
  let fakeQuestionTrainingService: any;
  const fakeVersion = { questions: [], answers: [] };

  beforeEach(async () => {
    fakeVersionService = {
      newVersion: jest.fn((type) => {
        return `fake-v`;
      }),
    };

    fakeVBrittanicatService = {
      train: jest.fn(),
    };
    fakeAnswerTrainingService = {
      train: jest.fn((id, version) => void 0),
    };
    fakeQuestionTrainingService = {
      train: jest.fn((id, version) => void 0),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingManagerService, {
        provide: VersionService,
        useValue: fakeVersionService,
      }, {
          provide: AmiBrittanicaService,
          useValue: fakeVBrittanicatService,
        }, {
          provide: AnswerTrainingService,
          useValue: fakeAnswerTrainingService,
        }, {
          provide: QuestionTrainingService,
          useValue: fakeQuestionTrainingService,
        }],
    }).compile();

    service = module.get<TrainingManagerService>(TrainingManagerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should train brittanica", async () => {
    const response = await service.train("brittanica", fakeVersion);
    expect(fakeVBrittanicatService.train).toHaveBeenCalled();
    expect(response).toEqual({
      type: "brittanica",
      id: "brittanica",
    });
    console.log(response);
  });

  it("should train answer", async () => {
    const response = await service.train("answer", fakeVersion);
    expect(fakeVersionService.newVersion).toHaveBeenCalledWith("answer");
    expect(fakeAnswerTrainingService.train).toHaveBeenCalledWith(
      "fake-v",
      fakeVersion,
    );

    expect(response).toEqual({
      type: "answer",
      id: "fake-v",
    });
    console.log(response);
  });

  it("should train a question", async () => {
    const response = await service.train("question", fakeVersion);
    expect(fakeVersionService.newVersion).toHaveBeenCalledWith("question");
    expect(fakeQuestionTrainingService.train).toHaveBeenCalledWith(
      "fake-v",
      fakeVersion,
    );
    expect(response).toEqual({
      type: "question",
      id: "fake-v",
    });
  });
});
