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

const readFileAsync = promises.readFile;
const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);

const pm = new ProcessManager(2);

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
  const fileName = path.split('/').pop();
  chalk.blue(`Sending ${fileName} to CRM`);
  const info = getFileInfo(path);
  const content = await readFileAsync(path);
  const { callType, rids } = info;
  await sendToCrm(rids, callType, content.toString(), ENV);
  await execAsync(`rm ${path}`);
  pm.stop(path);
  pm.cleanUp(path);
  chalk.green(`Sent to records: ${info.rids.join(',')} `);
  console.log(content.toString());
}

async function cleanUpFailedThread(path: string, e: Error) {
  chalk.yellow('Failed to send to CRM');
  console.log(e);
  if (pm.getAmountOfTries(path) > 3) {
    chalk.red('Failed to send to CRM 3 times, deleting file');
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
  target: 'test' | 'prod'
) {
  const testUrl = 'https://rofer-server.ngrok.io/monster-mono-repo/us-central1';
  const prodUrl =
    'https://us-central1-monster-mono-repo-beta.cloudfunctions.net';
  const url = target === 'test' ? testUrl : prodUrl;
  const final = `${url}/api/utils/save-call-transcription`;
  const date = new Date().toISOString();
  const payload = {
    ids,
    type,
    transcription,
    date,
  };
  const headers = {
    Authorization: 'Basic cmFmYXNCYWNrZW5kOnBpenphVGltZTIwMDAh',
  };
  const request = await axios.post(final, payload, { headers });
  return request.data;
}
