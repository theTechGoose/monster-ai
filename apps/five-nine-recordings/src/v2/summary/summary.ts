import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { UPDATE_INTERVAL } from '../../main';
import { ProcessManager } from '../shared/process-manager';
import { promises } from 'fs';
import { exec } from 'child_process';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAI } from 'langchain/llms/openai';
import { getFileInfo } from '../shared/get-file-info';

const readFileAsync = promises.readFile;
const writeFileAsync = promises.writeFile;
const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);

const pm = new ProcessManager(2);

let summaryQueue = [];

export function startCallSummary() {
  listenFiles();
  setInterval(newThread, UPDATE_INTERVAL);
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
});

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/transcriptions`;
    let files = await readdirAsync(dir);
    files = files.map((f) => `${dir}/${f}`);
    let notInQueue = files.filter((f) => !summaryQueue.includes(f));
    notInQueue = notInQueue.filter((f) => !pm.getProcesses().includes(f));
    summaryQueue = [...summaryQueue, ...notInQueue];
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed()) return;
  const path = summaryQueue.pop();
  if (!path) return;
  const id = pm.start(path);
  try {
    await execThread(id);
  } catch (e) {
    await cleanUpFailedThread(id, e);
  }
}

async function execThread(path: string) {
  const contentBuffer = await readFileAsync(path);
  const content = contentBuffer.toString();
  const maskedContent = maskCreditCard(content);
  const summary = await getSummary(maskedContent);
  const info = getFileInfo(path);
  const tidy = tidySummary(summary, info);
  const fileName = path.split('/').pop();
  const summaryPath = `${os.homedir()}/summaries/${fileName}.txt`;
  await writeFileAsync(summaryPath, tidy);
  await execAsync(`rm "${path}"`)
  pm.stop(path)
  pm.cleanUp(path)
}

async function cleanUpFailedThread(path: string, e: Error) {
  console.log('Summary Thread Failed')
  console.log(e)
  if (pm.getAmountOfTries(path) > 3) {
    await execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }
  pm.stop(path);
}

function tidySummary(summary: string, ids: ReturnType<typeof getFileInfo>) {
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
  output = `${ids.callType} call on ${ids.guestPhone} by ${ids.fullRep}: \n\n ${output}`;
  return output;
}

async function getSummary(transcription: string) {
  let chunks = await textSplitter.splitText(transcription);
  let summaryChunks = await getSubSummaries(chunks);
  let summaryText = summaryChunks.join('\n\n');

  if (summaryText.length > 12_000) {
    chunks = await textSplitter.splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks);
  }

  if (summaryText.length > 12_000) {
    chunks = await textSplitter.splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks);
  }

  if (summaryText.length > 12_000) {
    chunks = await textSplitter.splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks);
  }

  if (summaryText.length > 12_000) {
    chunks = await textSplitter.splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks);
  }

  let output = await llm.call(
    `This is a list of summaries of one phone call between a guest service agent and a guest of a vacation sales company.Please do not include any names in your summaries, refer to the guest as the guest and the agent as the team-member. The list of summaries is separated by \n\n please take all of these summaries and turn it into a single summary where all of the relevent points, misunderstandings or issues are stated. make the output a bulleted list of points: ${summaryText}`
  );

  return output;
}

async function getSubSummaries(chunks: Array<string>) {
  return await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `This is a chunk of a guest service call for monster reservations group. Your job is to find the important points in this chunk so that a bot can summarize them later. Please include any relevent points, misunderstandings, or issues within the chunk. Please do not include any names in your summaries, refer to the guest as the guest and the agent as the team-member. Make the output a bulleted list of points Chunk: ${chunk}`
      );
    })
  );
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
