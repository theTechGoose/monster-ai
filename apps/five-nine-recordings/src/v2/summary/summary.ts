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
import chalk from 'chalk';
import { analyzeText } from '../shared/deduper';
import { addSeconds, formatDistance } from 'date-fns';
import { getMetaData, setMetaData } from '../shared/data-manager';
import { timer } from '../shared/timer';
import { detectVoicemail } from './voicemail-detector';
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
  const chunkOverlap = Math.floor(size * 0.1);
  const chunkSize = size - chunkOverlap;
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
  return textSplitter;
}

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

const gpt4 = new OpenAI({
  modelName: 'gpt-4',
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
  timer(path);
  const fileName = path.split('/').pop();
  console.log(chalk.blue(`Summarizing ${fileName}`));
  const contentBuffer = await readFileAsync(path);
  let content = contentBuffer.toString();
  content = await condenseSpeech(content);
  const maskedContent = maskCreditCard(content);
  const info = await getMetaData(path);
  const summaryOutput = await getSummary(
    maskedContent,
    info.callType,
    path,
    info.recordingDuration
  );
  const summary = summaryOutput.output;
  const tidy = tidySummary(summary, info, summaryOutput.smolSummary);
  const summaryPath = `${os.homedir()}/summaries/${fileName}.txt`;
  await writeFileAsync(summaryPath, tidy);
  await execAsync(`rm "${path}"`);
  console.log(chalk.blue(`Summary ${fileName} complete`));
  pm.stop(path);
  pm.cleanUp(path);
  const times = timer(path);
  const metaData = await getMetaData(path);
  metaData.guestInfoSummary = summaryOutput.guestInfoSummary
  metaData.guestJson = summaryOutput.guestJson
  metaData.times.summarize = times;
  metaData.summary = {};
  metaData.summary.final = summaryOutput.output;
  metaData.summary.sub = summaryOutput.summaryText;
  metaData.summary.smolSummary = summaryOutput.smolSummary;
  await setMetaData(metaData);
}

async function cleanUpFailedThread(path: string, e: Error) {
  console.log(chalk.yellow('Summary Thread Failed'));
  console.log(e);
  if (pm.getAmountOfTries(path) > 3) {
    console.log(chalk.red('Summary Thread Failed 3 times, deleting file'));
    await execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }
  pm.stop(path);
}

function tidySummary(summary: string, ids: any, smolSummary: string) {
  const { repName, endDate, startDate, callId, recordingDuration } = ids;
  const roundDuration = Math.round(recordingDuration);
  const now = new Date();
  const later = addSeconds(now, roundDuration);
  const prettyDuration = formatDistance(now, later);
  // let hours = Math.floor(recordingDuration / 3600).toString()
  // hours = hours.length < 2 ? `0${hours}` : hours
  // let minutes = Math.floor((recordingDuration % 3600) / 60).toString()
  // minutes = minutes.length < 2 ? `0${minutes}` : minutes
  // let seconds = Math.floor((recordingDuration % 60)).toString()
  // seconds = seconds.length < 2 ? `0${seconds}` : seconds
  const startMilis = startDate.getTime();
  const endMilis = endDate.getTime();
  const milidiff = endMilis - startMilis;
  let duration = formatDistance(startDate, endDate);
  const fomattedCallId = `<<${
    !callId || callId === 'null' ? 'Unknown' : callId
  }>>`;
  if (milidiff < 100) {
    duration = 'unknown';
  }
  let output = summary;

  output = `${fomattedCallId} was a ${ids.type} call on ${ids.guestPhone} by ${ids.fullRep} it lasted ${prettyDuration}:  \n\n ${output} `;
  if (smolSummary)
    output =
      output +
      `\n\n === Smol Summary Start === \n\n ${smolSummary} \n\n === Smol Sumamry End ===`;

  output = output
    .split('agent')
    .join(repName)
    .split('team-member')
    .join(repName)
    .split('Agent')
    .join(repName)
    .split('Team-member')
    .join(repName)
    .split('employee')
    .join('team-member');

  return output;
}

async function getSummary(
  _transcription: string,
  callType: string,
  path: string,
  duration: number
) {
  let sentenceTarget = Math.round(duration / 60);
  sentenceTarget = Math.round(sentenceTarget / 2);
  sentenceTarget = sentenceTarget < 1 ? 1 : sentenceTarget;
  sentenceTarget = sentenceTarget > 35 ? 35 : sentenceTarget;
  const wordTarget = sentenceTarget * 20;
  const characterTarget = wordTarget * 5;
  console.log({ sentenceTarget, wordTarget, characterTarget, duration });
  const summaryPreprocess = analyzeText(_transcription);
  const { dedupedText } = summaryPreprocess;
  const transcription = dedupedText;
  let voicemailChunks = await createTextSplitter(1000).splitText(transcription);
  const metaData = await getMetaData(path);
  let chunks = await createTextSplitter(1000).splitText(transcription);
  const isVoicemail = await detectVoicemail(
    voicemailChunks,
    metaData.recordingDuration,
    metaData.type,
    100
  );
  if (isVoicemail) {
    if (transcription.length < 200)
      return {
        output: 'the team member did not leave a voicemail',
        summaryText: 'voicemail',
      };
    const voicemailPrompt = `
I am providing a transcription where our team member made an outbound call and recieved a voice mail box. Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. I would like you to analyze this transcription and provide at most three bullet points of important points derived from the content. Please remember not to infer or make up any information that isn't present or explicitly stated in the transcription. When referring to the individuals in the transcription, please use 'the guest' for the customer and 'the team-member' for our staff Remember not to infer or make up any information that isn't present or explicitly stated in the bullet points.

the team members name is ${metaData.repName} any other name is the guest name


if there is none of this available please provide any information you can on the content of the voicemail left by the team-member, if no message was left, please just say 'team-member did not leave a voicemail'

Please take into account these key areas while identifying the most critical information. Here's the transcription for your reference: ${transcription
      .split('team-member: ')
      .join('<speakerTurn>')
      .split('guest: ')
      .join('<speakerTurn>')}

this is an example of bad output, do not produce output like this or that contains the following please: Although the conversation didn't explicitly mention chargebacks, bank calls, refunds, bad guest experiences, misunderstandings, or the team member going the extra mile, these elements were not present in the bullet points provided.



`;
    const vmOutput = await llm.call(voicemailPrompt);
    return {
      output: vmOutput,
      summaryText: 'voicemail',
    };
  }
  console.log(chalk.blue('Starting to get summary'));
  let summaryChunks = await getSubSummaries(chunks, callType);

  let summaryText = summaryChunks.join('\n\n');

  if (summaryText.length > 12_000) {
    console.log(chalk.yellow('Summary too long, splitting into chunks 1'));
    chunks = await createTextSplitter(2000).splitText(summaryText);
    summaryChunks = await getSubSummaries(chunks, callType);
    summaryText = summaryChunks.join('\n\n');
  }

  if (summaryText.length > 14_000) {
    throw new Error('Call too long');
  }

  let output = await llm.call(
    `
I require a succinct summary of a ${callType} call held between a guest and a team member at Monster Reservations Group. The summary should be strictly based on the provided transcriptions, with no additional inferences, assumptions, or fabricated information. Aim to generate a ${sentenceTarget}-sentence summary that does not exceed ${wordTarget} words or ${characterTarget} characters.

Below, you will find the necessary summaries for reference:

--- Start Summaries ---

${summaryText}

--- End Summaries ---

Using these summaries as your source, craft a concise, comprehensive, and detailed account of the conversation.

For consistency, refer to the customer as 'the guest' and the company representative as 'the team member'. Remember, accuracy is key; the brand 'Booksy' should be correctly referred to as 'Booksi'.

Do not include any information that has to do with credit card information
`
  );

  if (
    output.includes(
      'details about chargebacks, calling the bank, refunds, bad guest experiences, misunderstandings'
    )
  ) {
    output = await llm.call(`
you explicitly said 'details about chargebacks, calling the bank, refunds, bad guest experiences, misunderstandings'
in the summary ${output}, given these points ${summaryText} please summarize this phone call.
`);
  }
  let smolSummary = null;

  if (output.length > 500) {
    smolSummary =
      await llm.call(`Please create a 75 word or less summary of the following:

=== start text ===
${output}
=== end text ===

please ensure that the output is less than 3 sentences. Please make sure that the output is less than 300 characters.

`);
  }

  const infoOutput = await getGuestInfoSummary(chunks, callType);
  const guestInfoSummary = infoOutput?.guestSummary;
  const guestJson = JSON.stringify(infoOutput?.guestJson, null, 2);
  console.log({guestSummary2: guestInfoSummary})

  return { output, summaryText, smolSummary, guestInfoSummary, guestJson  };
}

async function getSubSummaries(chunks: Array<string>, callType: string) {
  return await Promise.all(
    chunks.map(async (chunk) => {
      return await llm.call(
        `
I am providing chunk of a transcription of a ${callType}.  Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. I would like you to summarize this transcription into at most 5 sentences. Be specific and provide detail. Please remember not to infer or make up any information that isn't present or explicitly stated in the transcription.

Please refer to the customer as 'the guest' and our staff as 'the team member' in your summary. Here's the transcription for your reference:

=== transcription start ===

${chunk}

=== transcription end ===

do not include anything that has to do with credit card information

"

`
      );
    })
  );
}

async function getGuestInfoSummary(chunks: Array<string>, callType: string) {
  try {
    let jsonChunks = await getSubInfo(chunks, callType);

    const guestJson = jsonChunks.reduce((acc, val) => {
      try {
        const payload = JSON.parse(val);
        const newPayload = Object.keys(acc).reduce((acc2, key) => {
          const baseValue = acc[key];
          const valueToAdd = payload[key];
          if(!valueToAdd) return acc2

          if(!baseValue) {
            acc2[key] = valueToAdd
            return acc2
          }

          if(baseValue.multi) {
            acc2[key].data.push(valueToAdd)
            return acc2
          }

          baseValue.data.push(valueToAdd)
          return acc2
        }, {});
        console.log({newPayload, payload})
        return {...payload, ...newPayload}

      } catch {
        console.log('error parsing json for guest info');
        return acc;
      }
    }, {});



    const guestSummary = await gpt4.call(
      `Please take the following JSON object that describes a guest and turn it into a paragraph that describes the guest in detail. Please include any information that may be useful in a conversation with the guest, such as their interests, preferences, or any other information that may make the conversation more personal. Please remember not to infer or make up any information that isn't present or explicitly stated in the JSON object. Here is the JSON object: ${JSON.stringify(
        guestJson
      )}. The output should be at most 5 sentences and should be detailed and specific. Do not include any information that has to do with credit card information.
`
    );
    console.log({guestSummary1: guestSummary})

    return {guestJson, guestSummary}
  } catch {
    console.log('error getting guest info summary');
    return {}
  }
}



async function getSubInfo(chunks: Array<string>, callType: string) {
  return await Promise.all(
    chunks.map(async (_chunk) => {

      const chunkArr = _chunk.split('[team-member] ')
      const chunk = chunkArr.map((c, i) => {
        if (c.includes('[guest] ')) {
          const output = c.split('[guest] ')[1]
          return `line ${i}: ${output}`
        }
        return `line ${i}: ${c}`
      })

      return await gpt4.call(
        `
I am providing chunk of a transcription of a ${callType} that is only the guest side of the conversation.  Please stick strictly to the provided transcription and avoid any interence, extrapolation, or cration of information that isn't explicitly stated in the text. I would like you extract all information about the guest into a json object. Include any destinations talked about, guest preferences, interests, comments on family such as how many people in their family. Anything that may be of use later in speaking to that person and may make the conversation more personable. Be specific and provide detail. Please remember not to infer or make up any information that isn't present or explicitly stated in the transcription, here is an example JSON object with the exact keys I am looking for if you feel like there is more information worth extracting that could be used to make a connection with the guest use the additional notes field, use this template to model your output:
{
  "names": {
    "speaker": "John Doe",
    "spouse": "Jane Doe",
    "kids": ["Alice Doe", "Bob Doe"]
  },
  "familyNotes": "Two adults, two children aged 8 and 10",
  "travelGroup": "Family",
  "interests": ["beach holidays", "theme parks", "museums"],
  "destinations": ["Florida", "California", "France"],
  "travelDates": ["2024-07-01", "2024-07-15"],
  "eventNotes": {
    "birthdays": ["2024-07-04 (Alice)", "2024-08-10 (John)"],
    "holidays": ["Christmas", "New Year's Eve"]
  },
  "additionalNotes": "Prefers kid-friendly hotels with pools; interested in educational activities for children"
}

if information is not available, just put null in the field.
.

=== transcription start ===

${chunk}

=== transcription end ===

do not include anything that has to do with credit card information
"
`,
        {
          options: {
            responseType: 'json',
          },
        }
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
      console.log(
        chalk.red(
          `${match} positive for luhn replacing with XXXX-XXXX-XXXX-XXXX`
        )
      );
      return 'XXXX-XXXX-XXXX-XXXX';
    } else {
      console.log(
        chalk.green(`${match} negative for luhn passing value through`)
      );
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
