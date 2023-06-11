import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { ENV, MAX_RETRIES } from '../../main';
import { exec } from 'child_process';
import axios from 'axios';
import { ProcessManager } from '../shared/process-manager';
import chalk from 'chalk';
const execAsync = promisify(exec);

const pm = new ProcessManager({
  updateInterval: 1000,
  process: 'recordings',
  execInterval: 500,
  maxThreads: 1,
});

export function bootStrapRecordings() {
pm.registerExec(async (path: string, pm: ProcessManager) => { 
  await execThread(path);
});
}


async function execThread(path: string) {
  const rawFileName = path.split('/').pop();
  console.log(chalk.blue(`Identifying ${rawFileName} in CRM`));
  const callInfo = identifyCall(path);
  const foundResult = await findInCrm(callInfo.guestPhone, ENV);
  if (!foundResult.ids) {
    console.log(
      chalk.red(`${callInfo.guestPhone} not found in CRM deleting file`)
    );
    await execAsync(`rm "${path}"`);
    pm.stop(path);
    pm.cleanUp(path);
    return;
  }
  const fileName = `${callInfo.guestPhone}..${callInfo.repName}..${
    callInfo.fullRep
  }..${callInfo.type}..${foundResult.ids.join('-')}`;
  await sleep(60_000);
  await execAsync(
    `mv "${path}" "${os.homedir()}/toTranscribe/${fileName}.wav"`
  );
  console.log(
    chalk.blue(`Successfully identified ${rawFileName} as ${fileName}`)
  );
  pm.stop(path);
  pm.cleanUp(path);
}

async function sleep(ms: number) {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
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
  console.log(chalk.yellow('failed to run thread for call identification'));
  console.log(error);
  pm.stop(id);
  const tries = pm.getAmountOfTries(id);
  if (tries > MAX_RETRIES) {
    console.log(chalk.red('Failed to identify call 3 times, deleting file'));
    await execAsync(`rm -rf "${id}"`);
    pm.cleanUp(id);
    return;
  }
}

function identifyCall(path: string) {
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
