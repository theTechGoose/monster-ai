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
const llm = new OpenAI({ openAIApiKey: process.env.OPEN_AI_KEY });

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
  if (queue.length > 0) await popQueue();
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
  const summary = getSummary(fileContent);
  console.log(summary);
}

async function getSummary(summary: string) {
  const chunks = await textSplitter.splitText(summary);
  const summaryChunks = await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `You are an AI that has been tasked with summarizing a chunk of a larger text. After all the chunks have been summarized, another ai will summarize all of the summaries. Please summarize the following text: ${chunk}`
      );
    })
  );

  const summaryText = summaryChunks.join('\n\n');
  const output = llm.call(
    `You are an Ai that has been tasked with summarizing the output of other ais, the other ais output a summary of a chunk of a transcription. Please summarize the following: ${summaryText}`
  );
  return output;
}
