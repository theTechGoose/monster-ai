import { Document } from "langchain/document";
import { InsertOneResult, ObjectId } from "mongodb";

interface I_QuestionMetadata {
  relatedAnswers: Array<string>;
  _createdAt: string;
  createdAt: Date;
  timesUsed: number;
  id: string;
  _id: ObjectId;
}

export interface I_Question extends Omit<Document, "metadata"> {
  metadata: Omit<I_QuestionMetadata, "_id" | "createdAt">;
}

export class Question implements I_Question {
  pageContent = "";
  metadata = {
    relatedAnswers: [],
    _createdAt: "",
    createdAt: new Date(),
    timesUsed: 0,
    id: "",

    get _id() {
      return new ObjectId(this.id);
    },
  };

  static getIdFromInsertResult(result: InsertOneResult<Document>) {
    return result.insertedId.toString();
  }

  addAnswer(answerId: string) {
    this.metadata.relatedAnswers.push(answerId);
  }

  removeAnswer(answerId: string) {
    this.metadata.relatedAnswers = this.metadata.relatedAnswers.filter(
      (id) => id !== answerId
    );
  }

  updateUsed() {
    this.metadata.timesUsed++;
  }

  constructor(seed: I_Question | string, content?: string) {
    if (typeof seed === "string") {
      this.createFromId(seed, content);
    } else {
      this.createFromSeed(seed);
    }
  }

  serialize(): I_Question {
    return {
      pageContent: this.pageContent,
      metadata: {
        relatedAnswers: this.metadata.relatedAnswers,
        _createdAt: this.metadata._createdAt,
        timesUsed: this.metadata.timesUsed,
        id: this.metadata.id,
      },
    };
  }

  private createFromSeed(seed: Omit<I_Question, "_id">) {
    this.pageContent = seed.pageContent;
    this.metadata._createdAt = seed.metadata._createdAt;
    this.metadata.createdAt = new Date(seed.metadata._createdAt);
    this.metadata.relatedAnswers = seed.metadata.relatedAnswers;
    this.metadata.timesUsed = seed.metadata.timesUsed;
    this.metadata.id = seed.metadata.id;
  }

  private createFromId(id: string, content: string) {
    this.pageContent = content;
    this.metadata.id = id;
    this.metadata._createdAt = new Date().toISOString();
  }
}
