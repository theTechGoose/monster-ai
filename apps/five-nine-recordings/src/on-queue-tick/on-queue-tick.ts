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
  const id = nanoid();
  const transcriptionPath = `${os.homedir()}/transcriptions/${id}`;
  console.log(`Making transcription directory ${transcriptionPath}`);
  execSync(`mkdir "${transcriptionPath}"`);
  console.log(`Transcribing ${path}`);
  const command = `whisper "${path}" --output_dir "${transcriptionPath}" --model tiny.en`;
  execSync(command);
  console.log('done transcribing');
  const fileName = path.split('/').pop().split('.wav')[0];
  const newPath = `${transcriptionPath}/${fileName}.txt`;
  console.log('reading transcription');
  const fileContent = readFileSync(newPath, 'utf-8');
  console.log('starting summary');
  const summary = await getSummary(fileContent);
  console.log('identifying call');
  const ids = identifyCall(path);
  console.log('tidying summary');
  const tidy = tidySummary(summary, ids.repName);
  console.log(ids);
  console.log(tidy);

  console.log('cleaning up');
  cleanUp(transcriptionPath);
}

function cleanUp(transcriptionPath: string) {
  execSync(`rm -rf '${transcriptionPath}'`);
}

async function getSummary(summary: string) {
  const chunks = await textSplitter.splitText(summary);
  const summaryChunks = await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `This is a chunk of a guest service call for monster reservations group. Your job is to find the important points in this chunk so that a bot can summarize them later. Please include any relevent points, misunderstandings, or issues within the chunk. Please do not include any names in your summaries, refer to the guest as the guest and the agent as the team-member. Make the output a bulleted list of points Chunk: ${chunk}`
      );
    })
  );

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
    .join(repName)
    .split('Agent')
    .join(repName)
    .split('Team-member')
    .join(repName);
  return output;
}

function identifyCall(path: string) {
  console.log('identifying call');
  const lastEl = path.split('/').pop();
  const [phone1, phone2] = lastEl
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
  const fullRep = path.split('by')[1].split(' @ ')[0].trim();
  const repName = fullRep.split('@')[0].slice(0, -1);
  const type = internalNumbers.includes(phone1) ? 'outbound' : 'inbound';
  const guestPhone = type === 'outbound' ? phone2 : phone1;
  return { phone1, phone2, type, guestPhone, repName, fullRep };
}
