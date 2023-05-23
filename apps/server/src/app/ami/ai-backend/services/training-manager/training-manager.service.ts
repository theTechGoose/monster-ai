import { Injectable } from "@nestjs/common";
import { I_Version, T_TrainingArgWithAll } from "../../../models";
import { VersionService } from "../version/version.service";
import { AmiBrittanicaService } from "../ami-brittanica/ami-brittanica.service";
import { AnswerTrainingService } from "../answer-training/answer-training.service";
import { QuestionTrainingService } from "../question-training/question-training.service";

@Injectable()
export class TrainingManagerService {
  constructor(
    private version: VersionService,
    private brittanica: AmiBrittanicaService,
    private answer: AnswerTrainingService,
    private question: QuestionTrainingService,
  ) { }

  async train(type: T_TrainingArgWithAll, version: Omit<I_Version, "id">) {
    if (type === "brittanica") {
      await this.brittanica.train();
      return {
        type,
        id: "brittanica",
      };
    }
    const id = await this.version.newVersion(type);
    await this[type].train(id, version)
    return {
      type,
      id
    };
  }
}
