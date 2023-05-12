import { InsertOneResult, ObjectId } from "mongodb";
import { calculateShowChance } from "../../shared/scoring/scoring";
import { parse } from "papaparse";

export type Csv_Seed = string;

export class Csv {
  constructor(private seed: Csv_Seed) { }

  parse(): Array<Record<string, any>> {
    return parse(this.seed, { header: true }).data;
  }

  serialize() {
    return this.seed;
  }
}

export interface I_Answer {
  _id: string;
  _createdAt: string;
  upVotes: number;
  downVotes: number;
  content: string;
  relatedQuestion: string;
  score: number;
}

export class Answer implements Omit<I_Answer, '_id'> {
  static getIdFromInsertResult(result: InsertOneResult<Document>) {
    return result.insertedId.toString();
  }
  id: string;
  _createdAt: string;
  upVotes = 0;
  downVotes = 0;
  relatedQuestion: string;
  createdAt: Date;
  score = 0;
  content = ""

  get _id() {
    return new ObjectId(this.id)
  }

  constructor(seed: I_Answer | string, relatedQuestion?: string, content?: string) {
    const isNew = typeof seed === "string";
    isNew ? this.setUpNew(seed, relatedQuestion, content) : this.setUpExisting(seed);
  }

  private setUpExisting(seed: I_Answer) {
    this.id = seed._id;
    this._createdAt = seed._createdAt;
    this.upVotes = seed.upVotes;
    this.downVotes = seed.downVotes;
    this.relatedQuestion = seed.relatedQuestion;
    this.createdAt = new Date(seed._createdAt);
    this.score = calculateShowChance(seed);
    this.content = seed.content;
  }

  vote(type: 'up' | 'down') {
    if (type === 'up') {
      this.upVotes++;
    } else {
      this.downVotes++;
    }
    this.score = calculateShowChance(this.serialize());
  }

  private setUpNew(id: string, relatedQuestion: string, content: string) {
    if (!relatedQuestion) throw new Error("relatedQuestion is required");
    const now = new Date();
    this.id = id;
    this._createdAt = now.toISOString();
    this.relatedQuestion = relatedQuestion;
    this.createdAt = now;
    this.content = content;
  }

  serialize(): Omit<I_Answer, "_id"> {
    return {
      _createdAt: this._createdAt,
      content: this.content,
      upVotes: this.upVotes,
      downVotes: this.downVotes,
      score: this.score,
      relatedQuestion: this.relatedQuestion,
    };
  }
}
