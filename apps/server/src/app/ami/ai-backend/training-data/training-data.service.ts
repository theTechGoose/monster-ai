import { Injectable } from "@nestjs/common";
import {
  I_Answer,
  I_Question,
  I_Version,
  T_TrainingArgWithAll,
} from "../../models";
import { AmiDbService } from "../services/ami-db/ami-db.service";
import { TrainingManagerService } from "../services/training-manager/training-manager.service";

@Injectable()
export class TrainingDataService {
  constructor(
    private db: AmiDbService,
    private manager: TrainingManagerService,
  ) { }

  async upVote(id: string) {
    return await this.db.vote(id, "up");
  }

  async downVote(id: string) {
    return await this.db.vote(id, "down");
  }

  async train(arg: T_TrainingArgWithAll) {
    const version: Omit<I_Version, "id"> = {
      answers: await this.db.getAll<I_Answer>("answer"),
      questions: await this.db.getAll<I_Question>("question"),
    };
    this.manager.train(arg, version);
  }
}
