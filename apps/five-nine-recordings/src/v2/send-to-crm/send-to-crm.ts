import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { ENV, UPDATE_INTERVAL } from '../../main';
import { ProcessManager } from '../shared/process-manager';
import { promises } from 'fs';
import { exec } from 'child_process';
import { getFileInfo } from '../shared/get-file-info';
import chalk from 'chalk';
import axios from 'axios';
import {formatDistance} from 'date-fns'
import { getMetaData, clearMetaData } from '../shared/data-manager';
import { getTimeInDiff } from './get-time-diff';
import { getDurationFromSeconds, timer } from '../shared/timer';

const readFileAsync = promises.readFile;
const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);

const pm = new ProcessManager(4);

let sendQueue = [];

export function startSendToCrm() {
  listenFiles();
  setInterval(newThread, UPDATE_INTERVAL);
}

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/summaries`;
    let files = await readdirAsync(dir);
    files = files.map((f) => `${dir}/${f}`);
    let notInQueue = files.filter((f) => !sendQueue.includes(f));
    notInQueue = notInQueue.filter((f) => !pm.getProcesses().includes(f));
    sendQueue = [...sendQueue, ...notInQueue];
     await clearMetaData()
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed()) return;
  const path = sendQueue.pop();
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
  console.log(chalk.blue(`Sending ${fileName} to CRM`));
  const info = await getMetaData(path)
  const content = await readFileAsync(path);
  const { type, foundCallIds, endDate } = info;
  console.log({endDate})
  const stringifiedDate = endDate.toISOString()
  await sendToCrm(foundCallIds, type, content.toString(), stringifiedDate, ENV);
  await execAsync(`rm ${path}`);
  pm.stop(path);
  pm.cleanUp(path);
  console.log(chalk.green(`Sent to records: ${foundCallIds.join(',')} `));
  console.log(content.toString());
  const metaData = await getMetaData(path)
  const timeInSystem = getTimeInDiff(metaData.systemIntakeDate)
  const timeFromEndToTranscribe = getTimeInDiff(metaData.endDate)
  metaData.timeInSystem = timeInSystem
  metaData.timeInSystem = getDurationFromSeconds(metaData.timeInSystem)
  metaData.timeFromEndToTranscribe= timeFromEndToTranscribe
  metaData.timeFromEndToTranscribe = getDurationFromSeconds(metaData.timeFromEndToTranscribe)
  const times = timer(path)
  metaData.times.sendToCrm = times
  console.log('XXXXXXXXXXXXX')
  console.log({metaData})
  console.log('XXXXXXXXXXXXX')
}

async function cleanUpFailedThread(path: string, e: Error) {
  console.log(chalk.yellow('Failed to send to CRM'));
  console.log(e);
  if (pm.getAmountOfTries(path) > 3) {
    console.log(chalk.red('Failed to send to CRM 3 times, deleting file'));
    await execAsync(`rm ${path}`);
    pm.stop(path);
    pm.cleanUp(path);
    return;
  }
  pm.stop(path);
}

async function sendToCrm(
  ids: Array<number>,
  type: string,
  transcription: string,
  endDate: string,
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
    date: endDate,
  };
  const headers = {
    Authorization: 'Basic cmFmYXNCYWNrZW5kOnBpenphVGltZTIwMDAh',
  };
  console.log({payload})
  const request = await axios.post(final, payload, { headers });
  return request.data;
}
