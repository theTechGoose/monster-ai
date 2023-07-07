import os from 'os';
import { readdir, promises } from 'fs';
import {nanoid} from 'nanoid'
import {setMetaData, getMetaData} from '../shared/data-manager'
import {addHours} from 'date-fns'

import { promisify } from 'util';
import {
  ENV,
  MAX_RETRIES,
  UPDATE_INTERVAL,
  IDENTIFY_RECORDING_UPDATE_INTERVAL,
} from '../../main';
import { exec } from 'child_process';
import axios from 'axios';
import { ProcessManager } from '../shared/process-manager';
import chalk from 'chalk';
import { timer } from '../shared/timer';

const fs = {
  stat: promises.stat
}

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);

let identificationQueue = [];

const pm = new ProcessManager(8);

export function startCallIdentification() {
  listenFiles();
  setInterval(newThread, IDENTIFY_RECORDING_UPDATE_INTERVAL);
}

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/recordings`;
    let files = await readdirAsync(dir);
    files = files.map((f) => `/home/raphael/recordings/${f}`);
    let notInQueue = files.filter((f) => !identificationQueue.includes(f));
    notInQueue = notInQueue.filter((f) => !pm.getProcesses().includes(f));
    identificationQueue = [...identificationQueue, ...notInQueue];
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed()) return;
  const path = identificationQueue.pop();
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
  const rawFileName = path.split('/').pop();
  console.log(chalk.blue(`Identifying ${rawFileName} in CRM`));
  const callInfo = identifyCall(path);
  const foundResult = await findInCrm(callInfo.guestPhone, ENV);
  if (!foundResult.ids) {
    console.log(chalk.red(`${callInfo.guestPhone} not found in CRM deleting file`));
    await execAsync(`rm "${path}"`);
    pm.stop(path);
    pm.cleanUp(path);
    return;
  }
  const fileName = `${callInfo.guestPhone}..${callInfo.repName}..${
    callInfo.fullRep
  }..${callInfo.type}..${foundResult.ids.join('-')}..${callInfo.callId}..${callInfo.startDate}..${callInfo.endDate}`;
  //await sleep(60_000)
  callInfo.systemIntakeDate = new Date().toISOString()
  callInfo.foundCallIds = foundResult.ids
  callInfo.times = {}
  
  
  const metaId =  await setMetaData(callInfo)
  const fileAwaitResult = await waitForNonEmptyFile(path)
  if(fileAwaitResult === 'null') {
    throw new Error('waited more than 3 minutes for the file to load.')
  }
  
 
  await execAsync(`mv "${path}" "${os.homedir()}/toTranscribe/${metaId}.wav"`);
   console.log(chalk.blue(`Successfully identified ${rawFileName} as ${metaId}`));
  pm.stop(path);
  pm.cleanUp(path);
  const callIdentify = timer(path)
  callInfo.times.callIdentify = callIdentify
  callInfo.id = metaId
  await setMetaData(callInfo)
}


async function sleep(ms: number) {
  return new Promise(r => {
    setTimeout(r, ms)
  })
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
  try {
  const request = await axios.post(final, payload, { headers });
  return request.data;
  } catch(e) {
    console.log(payload, final)
    throw e
  }
}

async function cleanUpFailedThread(id: string, error: Error) {
  console.log(chalk.yellow('failed to run thread for call identification'));
  console.log(error);
  const tries = pm.getAmountOfTries(id);
  if (tries > MAX_RETRIES) {
    console.log(chalk.red('Failed to identify call 3 times, deleting file'))
    await execAsync(`rm -rf "${id}"`);
    pm.cleanUp(id);
    return;
  }
  pm.stop(id);
}

function identifyCall(path: string): any {
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
  let fullRep = path.split('by')[1].split(' @ ')[0].trim();
  fullRep = fullRep ? fullRep : 'Nobody'
  let repName = fullRep.split('@')[0].slice(0, -1);
  repName = fullRep === 'Nobody' ? fullRep : repName
  const type = internalNumbers.includes(phone1) ? 'outbound' : 'inbound';
  const guestPhone = type === 'outbound' ? phone2 : phone1;
  let callId = ''
  try {
    callId = path.split('callid')[1].split('.wav').join('') || `UKN-${nanoid()}`
  } catch {
    callId = `UKN-${nanoid()}`
  }
  const dates = extractDates(path)
  
  return { phone1, phone2, type, guestPhone, repName, fullRep, callId, ...dates };
}

function extractDates(inputString) {
    // Regex pattern to match dates in the given format
    let datePattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/g;

    // Extract all dates from string
    let dates = inputString.match(datePattern);

    if(dates && dates.length >= 2){
        // Parse the dates to JavaScript Date objects
        let startDate = addHours(new Date(dates[0]), 3);
        let endDate = addHours(new Date(dates[1]), 3);
    
    

        // Return start and end date
        return {startDate: startDate.toISOString(), endDate: endDate.toISOString()};
    }
    else{
        return {startDate:'null', endDate: 'null'}
    }
}

async function waitForNonEmptyFile(filePath: string) {
  let time = 0
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
      time++
      
      if(time > 180) {
         clearInterval(interval);
        resolve('null')
      }
      
      if(time % 20 === 0) {
        console.log(`waiting for recording to load, has not loaded for ${time} seconds`)
      }
      
            try {
                const stats = await fs.stat(filePath);
                if (stats.size > 0) {
                    clearInterval(interval);
                    resolve('');
                }
            } catch (error) {
                clearInterval(interval);
                reject(error);
            }
        }, 1000);  // checks every 1 second
    });
}
