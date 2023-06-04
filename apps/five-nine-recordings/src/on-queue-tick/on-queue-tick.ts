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

  const command = `whisper '${path}' --output_dir ${transcriptionPath} --model tiny.en`;
  execSync(command);
  const fileName = path.split('/').pop().split('.')[0];
  const newPath = `${transcriptionPath}/${fileName}.txt`;
  const fileContent = readFileSync(newPath, 'utf-8');
  const summary = await getSummary(fileContent);
  const ids = identifyCall(path);
  const tidy = tidySummary(summary, ids.repName);
  console.log(ids);
  console.log(tidy);

  cleanUp(transcriptionPath);
}

function cleanUp(transcriptionPath: string) {
  console.log('cleaning up');
  execSync(`rm -rf '${transcriptionPath}'`);
}

async function getSummary(summary: string) {
  console.log(`begining summarization`);
  const chunks = await textSplitter.splitText(summary);
  const summaryChunks = await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `This is a chunk of a guest service call for monster reservations group. Your job is to find the important points in this chunk so that a bot can summarize them later. Please include any relevent points, misunderstandings, or issues within the chunk. Please do not include any names in your summaries, refer to the guest as the guest and the agent as the team-member. Make the output a bulleted list of points Chunk: ${chunk}`
      );
    })
  );

  console.log('begining summarization of summaries');

  const summaryText = summaryChunks.join('\n\n');
  let output = await llm.call(
    `This is a list of summaries of one phone call between a guest service agent and a guest of a vacation sales company.Please do not include any names in your summaries, refer to the guest as the guest and the agent as the team-member. The list of summaries is separated by \n\n please take all of these summaries and turn it into a single summary where all of the relevent points, misunderstandings or issues are stated. make the output a bulleted list of points: ${summaryText}`
  );

  return output;
}

function tidySummary(summary: string, repName: string) {
  let output = summary
    .split('agent')
    .join(repName)
    .split('team-member')
    .join(repName);
  return output;
}

function identifyCall(path: string) {
  console.log('identifying call');
  const [phone1, phone2] = path
    .split('by')[0]
    .split('-')
    .map((s) => s.trim());
  const internalNumbers = [
    '8442119332',
    '8446482229',
    '8447351800',
    '8448832212',
    '9343339857',
    '8885561485',
    '8442000919',
    '6783629986',
    '8446482229',
    '8447351800',
  ];
  const repName = path.split('by')[1].split(' @ ')[0].trim().split('@')[0];
  const type = internalNumbers.includes(phone1) ? 'inbound' : 'outbound';
  const guestPhone = type === 'inbound' ? phone2 : phone1;
  return { phone1, phone2, type, guestPhone, repName };
}
