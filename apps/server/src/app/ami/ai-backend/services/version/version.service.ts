import { Injectable } from "@nestjs/common";
import { T_TrainingArg } from "../../../models";
import { getLocalDbClient } from "../../.../../../../shared/local-db/local-db";
import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";

@Injectable()
export class VersionService {
  private dbName = "versions";
  private testDbName = "test-versions";
  private docId = "64694090e6415c88fc6d97ec";

  async getVersionNames(arg: T_TrainingArg): Promise<string[]> {
    const collection = this.createDb(arg);
    const _id = new ObjectId(this.docId);
    const doc = await collection.findOne({ _id });
    return doc.versions;
  }

  async getCurrentVersion(arg: T_TrainingArg): Promise<string> {
    const collection = this.createDb(arg);
    const _id = new ObjectId(this.docId);
    const doc = await collection.findOne({ _id });
    return doc.versions[doc.versions.length - 1];
  }

  async newVersion(arg: T_TrainingArg): Promise<string> {
    const collection = this.createDb(arg);
    const _id = new ObjectId(this.docId);
    const doc = await collection.findOne({ _id });
    const versionId = nanoid();
    if (!doc) {
      await collection.insertOne({ _id, versions: [versionId] });
    } else {
      doc.versions.push(versionId);
      await collection.updateOne({ _id }, { $set: { versions: doc.versions } });
    }
    return versionId;
  }

  private createDb(arg: T_TrainingArg) {
    const client = getLocalDbClient();
    client.connect();
    const isTest = process.env["IS_TEST"] === "true";
    const { testDbName, dbName } = this;
    const db = client.db(isTest ? testDbName : dbName);
    const collection = db.collection(arg);
    return collection;
  }
}
