//import { firestore, storage } from 'firebase-admin';
import { nanoid } from 'nanoid';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { queue } from '../on-file-add/on-file-add';
import os from 'os';

// const db = firestore();
// const bucket = storage();
const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
});

let isTranscribing = false;

export function onQueueTick() {
  if (isTranscribing) return;
  if (queue.length === 0) return;
  isTranscribing = true;
  console.log(`Elements have been added to the queue. Length: ${queue.length}`);
  popQueue();
}

async function popQueue() {
  const path = queue.pop();
  await execTranscription(path);
  if (queue.length > 0) {
    console.log(
      `Detected another element in the queue. Length ${queue.length}`
    );

    await popQueue();
  }
  isTranscribing = false;
}

async function execTranscription(path: string) {
  console.log(`Transcribing ${path}`);
  const id = nanoid();
  const transcriptionPath = `${os.homedir()}/transcriptions/${id}`;
  execSync(`mkdir ${transcriptionPath}`);

  const command = `whisper ${path} --output_dir ${transcriptionPath} --model tiny.en`;
  execSync(command);
  const fileName = path.split('/').pop().split('.')[0];
  const newPath = `${transcriptionPath}/${fileName}.txt`;
  const fileContent = readFileSync(newPath, 'utf-8');
  console.log(`deleting ${transcriptionPath}`);
  execSync(`rm -rf ${transcriptionPath}`);
  const summary = await getSummary(fileContent);
  console.log(summary);
}

async function getSummary(summary: string) {
  console.log(`begining summarization`);
  const chunks = await textSplitter.splitText(summary);
  const summaryChunks = await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `This is a chunk of a customer service call for a vacation company. Your job is to find the important points in this chunk so that a bot can summarize them later. Please include any relevent points, misunderstandings, or issues within the chunk. Chunk: ${chunk}`
      );
    })
  );

  console.log('begining summarization of summaries');

  const summaryText = summaryChunks.join('\n\n');
  const output = await llm.call(
    `This is a list of summaries of one phone call between a customer service agent and a guest of a vacation sales company. The list of summaries is separated by \n\n please take all of these summaries and turn it into a single summary where all of the relevent points, misunderstandings or issues are stated: ${summaryText}`
  );
  return output;
}
