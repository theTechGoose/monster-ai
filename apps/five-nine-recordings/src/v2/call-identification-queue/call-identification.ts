import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { ENV, MAX_RETRIES, UPDATE_INTERVAL, IDENTIFY_RECORDING_UPDATE_INTERVAL} from '../../main';
import { exec } from 'child_process';
import axios from 'axios';
import {ProcessManager} from "../shared/process-manager"

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);

let identificationQueue = [];

const pm = new ProcessManager(5);

export function startCallIdentification() {
  listenFiles();
  setInterval(newThread, IDENTIFY_RECORDING_UPDATE_INTERVAL );
}

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/recordings`;
    let files = await readdirAsync(dir);
    files = files.map(f => `/home/raphael/recordings/${f}`)
    let notInQueue = files.filter((f) =>  !identificationQueue.includes(f));
    notInQueue = notInQueue.filter((f) => !pm.getProcesses().includes(f))
    
    identificationQueue = [...identificationQueue, ...notInQueue];
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed()) return;
  const path = identificationQueue.pop();
  if(!path) return
  const id = pm.start(path);
  try {
    await execThread(id);
  } catch (e) {
    await cleanUpFailedThread(id, e);
  }
}

async function execThread(path: string) {
  try {
  const callInfo = identifyCall(path);
  const foundResult = await findInCrm(callInfo.guestPhone, ENV);
  if (!foundResult.ids) {
    execAsync(`rm "${path}"`)
    pm.stop(path)
    pm.cleanUp(path)
    return
  }
  const fileName = `${callInfo.guestPhone}..${
    callInfo.repName
  }..${callInfo.fullRep}--${foundResult.ids.join('-')}`;
  execAsync(`mv "${path}" "${os.homedir()}/toTranscribe/${fileName}.wav"`);
  pm.stop(path);
  pm.cleanUp(path);
  } catch(e) {
    cleanUpFailedThread(path, e)
  }
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
