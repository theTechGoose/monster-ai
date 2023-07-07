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
import chalk from "chalk"
import {analyzeText} from '../shared/deduper'
import { formatDistance } from 'date-fns';
import { getMetaData, setMetaData } from '../shared/data-manager';
import { timer } from '../shared/timer';
import {detectVoicemail} from './voicemail-detector'
import { condenseSpeech } from './condense-speakers';


const readFileAsync = promises.readFile;
const writeFileAsync = promises.writeFile;
const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);

const pm = new ProcessManager(4);

let summaryQueue = [];

export function startCallSummary() {
  listenFiles();
  setInterval(newThread, UPDATE_INTERVAL);
}


function createTextSplitter(size: number) {
  const chunkOverlap = Math.floor(size * 0.1)
  const chunkSize = size - chunkOverlap
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize,
  chunkOverlap
});
  return textSplitter
}

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
  timer(path)
  const fileName = path.split('/').pop();
  console.log(chalk.blue(`Summarizing ${fileName}`))
  const contentBuffer = await readFileAsync(path);
  let content = contentBuffer.toString();
  content = await condenseSpeech(content)
  const maskedContent = maskCreditCard(content);
  const info = await getMetaData(path) 
  const summaryOutput = await getSummary(maskedContent, info.callType, path);
  const summary = summaryOutput.output
  const tidy = tidySummary(summary, info);
  const summaryPath = `${os.homedir()}/summaries/${fileName}.txt`;
  await writeFileAsync(summaryPath, tidy);
  await execAsync(`rm "${path}"`)
  console.log(chalk.blue(`Summary ${fileName} complete`))
  pm.stop(path)
  pm.cleanUp(path)
  const times = timer(path)
  const metaData = await getMetaData(path)
  metaData.times.summarize = times
  metaData.summary = {}
  metaData.summary.final = summaryOutput.output
  metaData.summary.sub = summaryOutput.summaryText
  await setMetaData(metaData)
}

async function cleanUpFailedThread(path: string, e: Error) {
  console.log(chalk.yellow('Summary Thread Failed'))
  console.log(e)
  if (pm.getAmountOfTries(path) > 3) {
    console.log(chalk.red('Summary Thread Failed 3 times, deleting file'))
    await execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }
  pm.stop(path);
}

function tidySummary(summary: string, ids: any) {
  const {repName, endDate, startDate, callId} = ids
  const startMilis = startDate.getTime();
  const endMilis = endDate.getTime();
  const milidiff = endMilis - startMilis
  let duration = formatDistance(startDate, endDate)
  const fomattedCallId = `<<${!callId || callId === 'null' ?  'Unknown' : callId}>>`
  if(milidiff < 100) {
    duration = 'unknown'
  }
  let output = summary
    .split('agent')
    .join(repName)
    .split('team-member')
    .join(repName)
    .split('Agent')
    .join(repName)
    .split('Team-member')
    .join(repName);
  output = `${fomattedCallId} was a ${ids.type} call on ${ids.guestPhone} by ${ids.fullRep} it lasted ${duration}: \n\n ${output}`;
  return output;
}

async function getSummary(_transcription: string, callType: string, path: string) {
  const summaryPreprocess = analyzeText(_transcription)
  const {dedupedText} = summaryPreprocess
  const transcription = dedupedText
  let voicemailChunks = await createTextSplitter(1000).splitText(transcription);
  const metaData = await getMetaData(path)
  let chunks = await createTextSplitter(1000).splitText(transcription);
  const isVoicemail = await detectVoicemail(voicemailChunks, metaData.recordingDuration, metaData.type, 100)
  if(isVoicemail) {
    if(transcription.length < 200) return {
    output: 'the team member did not leave a voicemail',
    summaryText: 'voicemail'
    }
  const voicemailPrompt = `
I am providing a transcription where our team member made an outbound call and recieved a voice mail box. Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. I would like you to analyze this transcription and provide at most three bullet points of important points derived from the content. Please remember not to infer or make up any information that isn't present or explicitly stated in the transcription. When referring to the individuals in the transcription, please use 'the guest' for the customer and 'the team-member' for our staff Remember not to infer or make up any information that isn't present or explicitly stated in the bullet points.

the team members name is ${metaData.repName} any other name is the guest name


if there is none of this available please provide any information you can on the content of the voicemail left by the team-member, if no message was left, please just say 'team-member did not leave a voicemail'

Please take into account these key areas while identifying the most critical information. Here's the transcription for your reference: ${transcription.split('team-member: ').join('<speakerTurn>').split('guest: ').join('<speakerTurn>')}

this is an example of bad output, do not do this: Although the conversation didn't explicitly mention chargebacks, bank calls, refunds, bad guest experiences, misunderstandings, or the team member going the extra mile, these elements were not present in the bullet points provided.



`  
    const vmOutput = await llm.call(voicemailPrompt)
      return {
      output: vmOutput,
      summaryText: 'voicemail'
    }
    
  }
  console.log(chalk.blue('Starting to get summary'))
  let summaryChunks = await getSubSummaries(chunks, callType);
  
  
  let summaryText = summaryChunks.join('\n\n');

  if (summaryText.length > 12_000) {
    console.log(chalk.yellow('Summary too long, splitting into chunks 1'));
    chunks = await createTextSplitter(2000).splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks, callType);
    summaryText = summaryChunks.join('\n\n')
  }

  if(summaryText.length > 14_000) {
    throw new Error('Call too long')
  } 

  let output = await llm.call(
    `
I am providing a series of bullet points that summarize a ${callType} call between a guest and a team member. These bullet points have been derived from segmented parts of the original conversation. Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. Be specific and provide detail. I would like you to compile these bullet points and provide an overall summary of the conversation. Remember not to infer or make up any information that isn't present or explicitly stated in the bullet points.

The bullet points are:

--- start bullet points ---

${summaryText}

--- end bullet points ---

Based on these points, could you provide a concise and comprehensive summary of the conversation. If there are no points just say there is nothing to summerize. do not make anything up.

And remember to refer to the customer as 'the guest' and our staff as 'the team member'. Please be specific and provide as much detail as the summary will allow.

if specific details do not exist just omit them, this is another example of bad output: although specific details regarding chargebacks, bank calls, refunds, bad guest experiences, misunderstandings, or the team member going the extra mile were not mentioned, these elements were also not present in the provided bullet points


`
  );

  if(output.includes('details about chargebacks, calling the bank, refunds, bad guest experiences, misunderstandings')) {
    output = await llm.call(`
you explicitly said 'details about chargebacks, calling the bank, refunds, bad guest experiences, misunderstandings'
in the summary ${output}, given these points ${summaryText} please summarize this phone call.
`)
    
  }

  return {output, summaryText};
  
}

async function getSubSummaries(chunks: Array<string>, callType: string) {
  return await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `
I am providing chunk of a transcription of a ${callType}.  Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. I would like you to analyze this transcription and provide at most five bullet points of important points derived from the content. Be specific and provide detail. Please remember not to infer or make up any information that isn't present or explicitly stated in the transcription.

Emphasize and prioritize any details related to:

    Chargebacks
    The mention of calling the bank
    Refunds
    Bad guest experiences
    Misunderstandings
    The team member going the extra mile

Please refer to the customer as 'the guest' and our staff as 'the team member' in your summary. Here's the transcription for your reference: ${chunk}

if specific details do not exist just omit them, this is another example of bad output: although specific details regarding chargebacks, bank calls, refunds, bad guest experiences, misunderstandings, or the team member going the extra mile were not mentioned, these elements were also not present in the provided bullet points

"

`
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
    console.log(chalk.yellow(`found potential cc match ${match}`));

    // Validate length and Luhn algorithm
    if (
      justNumbers.length >= 13 &&
      justNumbers.length <= 19 &&
      luhnCheck(justNumbers)
    ) {
      console.log(chalk.red(`${match} positive for luhn replacing with XXXX-XXXX-XXXX-XXXX`));
      return 'XXXX-XXXX-XXXX-XXXX';
    } else {
      console.log(chalk.green(`${match} negative for luhn passing value through`));
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
