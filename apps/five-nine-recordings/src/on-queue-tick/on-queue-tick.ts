//import { firestore, storage } from 'firebase-admin';
import { nanoid } from 'nanoid';
import { promisify } from 'util';
import { exec } from 'child_process';
import { readFile } from 'fs';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import axios from 'axios';

const execAsync = promisify(exec);
const readFileAsync = promisify(readFile);

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

export function reset() {
  isTranscribing = false;
  console.log('resetting!');
}

export async function onQueueTick() {
  if (isTranscribing) return;
  if (queue.length === 0) return;
  isTranscribing = true;
  console.log(`Elements have been added to the queue. Length: ${queue.length}`);
  const threads = 3;
  const promises = [];
  for (let i = 0; i < threads; i++) {
    const p = popQueue();
    promises.push(p);
  }
  await Promise.all(promises);
}

export const currentState = [];

async function popQueue() {
  const path = queue.pop();
  currentState.push(path);
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
  const env = 'prod';
  const ids = identifyCall(path);
  console.log('looking for result in the crm');
  const foundResult = await findInCrm(ids.guestPhone, env);
  console.log(foundResult);
  const id = nanoid();
  const transcriptionPath = `${os.homedir()}/transcriptions/${id}`;
  console.log(`Making transcription directory ${transcriptionPath}`);
  await execAsync(`mkdir "${transcriptionPath}"`);
  if (!foundResult.ids) {
    console.log('No call found in CRM');
    cleanUp(transcriptionPath, path);
    return;
  }
  console.log(`Transcribing ${path}`);
  const command = `whisper "${path}" --output_dir "${transcriptionPath}" --model tiny.en`;
  await execAsync(command);
  console.log('done transcribing');
  const fileName = path.split('/').pop().split('.wav')[0];
  const newPath = `${transcriptionPath}/${fileName}.txt`;
  console.log('reading transcription');
  const fileContent = (await readFileAsync(newPath, 'utf-8')) as any;
  console.log('running masking algorithm');
  const maskedFileContent = maskCreditCard(fileContent);
  console.log('starting summary');
  const summary = await getSummary(maskedFileContent);
  console.log('identifying call');
  console.log('tidying summary');
  const tidy = tidySummary(summary, ids);
  console.log(ids);
  console.log(tidy);
  console.log('sending request');
  const response = await sendToCrm(
    foundResult.ids,
    foundResult.type,
    tidy,
    env
  );
  console.log(response);
  console.log('cleaning up');
  await cleanUp(transcriptionPath, path);
}

async function cleanUp(transcriptionPath: string, callPath: string) {
  const pathIndex = currentState.indexOf(callPath);
  currentState.splice(pathIndex, 1);
  await execAsync(`rm -rf '${transcriptionPath}'`);
  await execAsync(`rm -rf '${callPath}'`);
}

async function findInCrm(phone: string, target: 'test' | 'prod') {
  const testUrl = 'https://rofer-server.ngrok.io/monster-mono-repo/us-central1';
  const prodUrl =
    'https://us-central1-monster-mono-repo-beta.cloudfunctions.net';
  const url = target === 'test' ? testUrl : prodUrl;
  const final = `${url}/api/utils/find-call`;
  const payload = {
    phone,
  };
  const headers = {
    Authorization: 'Basic cmFmYXNCYWNrZW5kOnBpenphVGltZTIwMDAh',
  };
  const request = await axios.post(final, payload, { headers });
  return request.data;
}

async function sendToCrm(
  ids: Array<number>,
  type: string,
  transcription: string,
  target: 'test' | 'prod'
) {
  const testUrl = 'https://rofer-server.ngrok.io/monster-mono-repo/us-central1';
  const prodUrl =
    'https://us-central1-monster-mono-repo-beta.cloudfunctions.net';
  const url = target === 'test' ? testUrl : prodUrl;
  const final = `${url}/api/utils/save-call-transcription`;
  const payload = {
    ids,
    type,
    transcription,
  };
  const headers = {
    Authorization: 'Basic cmFmYXNCYWNrZW5kOnBpenphVGltZTIwMDAh',
  };
  const request = await axios.post(final, payload, { headers });
  return request.data;
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

function tidySummary(summary: string, ids: ReturnType<typeof identifyCall>) {
  const repName = ids.repName;
  let output = summary
    .split('agent')
    .join(repName)
    .split('team-member')
    .join(repName)
    .split('Agent')
    .join(repName)
    .split('Team-member')
    .join(repName);
  output = `${ids.type} call on ${ids.guestPhone} by ${ids.fullRep}: \n\n ${output}`;
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

function maskCreditCard(text: string) {
  // Regex to identify probable card numbers
  let potentialCardNumber = /\b(?:\d[\s-.,]*?){13,19}\b/g;

  let maskedText = text.replace(potentialCardNumber, function (match: string) {
    // Remove non-digit characters
    let justNumbers = match.replace(/\D/g, '');
    console.log(`found potential cc match ${match}`);

    // Validate length and Luhn algorithm
    if (
      justNumbers.length >= 13 &&
      justNumbers.length <= 19 &&
      luhnCheck(justNumbers)
    ) {
      console.log(`${match} positive for luhn discarding`);

      return 'XXXX-XXXX-XXXX-XXXX';
    } else {
      console.log(`${match} negative for luhn passing through`);
      return match;
    }
  });

  return maskedText;
}

function luhnCheck(value: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 == 0;
}
