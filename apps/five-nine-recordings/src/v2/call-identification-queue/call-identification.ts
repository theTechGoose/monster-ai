import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { ENV, MAX_RETRIES, UPDATE_INTERVAL } from '../../main';
import { exec } from 'child_process';
import axios from 'axios';

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);

export class ProcessManager {
  private processes = {};
  constructor(private maxThreads: number) {}

  isMaxed() {
    const processEntries = Object.entries(this.processes) as unknown as {
      count: number;
      isLive: boolean;
    }[];
    const currentThreads = processEntries.reduce((acc, val) => {
      const isLive = val[1].isLive;
      if (!isLive) return acc;
      return acc + 1;
    }, 0);
    return currentThreads > this.maxThreads;
  }

  getAmountOfTries(id: string) {
    return this.processes[id].count;
  }

  start(id: string) {
    if (!this.processes[id]) this.processes[id] = { count: 0 };
    this.processes[id].isLive = true;
    this.processes[id].count++;
    return id;
  }

  stop(id: string) {
    this.processes[id].isLive = false;
    return id;
  }

  cleanUp(id: string) {
    delete this.processes[id];
    return id;
  }
}

let identificationQueue = [];

const pm = new ProcessManager(2);

export async function startCallIdentification() {
  listenFiles();
  setInterval(newThread, UPDATE_INTERVAL);
}

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/recordings`;
    const files = await readdirAsync(dir);
    const notInQueue = files.filter((f) => !identificationQueue.includes(f));
    identificationQueue = [...identificationQueue, ...notInQueue];
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed) return;
  const path = identificationQueue.pop();
  const id = pm.start(path);
  try {
    await execThread(id);
  } catch (e) {
    await cleanUpFailedThread(id, e);
  }
}

async function execThread(path: string) {
  const callInfo = identifyCall(path);
  const foundResult = await findInCrm(callInfo.guestPhone, ENV);
  if (!foundResult.ids) {
  }
  const fileName = `${callInfo.guestPhone}-${
    callInfo.repName
  }--${foundResult.ids.join('-')}`;
  execAsync(`mv "${path}" "${os.homedir()}/toTranscribe/${fileName}.wav"`);
  pm.stop(path);
  pm.cleanUp(path);
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

async function cleanUpFailedThread(id: string, error: Error) {
  console.log('failed to run thread for call identification');
  console.log(error);
  pm.stop(id);
  const tries = pm.getAmountOfTries(id);
  if (tries > MAX_RETRIES) {
    await execAsync(`rm -rf "${id}"`);
    pm.cleanUp(id);
    return;
  }
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
