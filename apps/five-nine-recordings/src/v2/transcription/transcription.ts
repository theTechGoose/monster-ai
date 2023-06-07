import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { UPDATE_INTERVAL } from '../../main';
import { ProcessManager } from '../shared/process-manager';
import { exec } from 'child_process';
import chalk from 'chalk';

const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);
const pm = new ProcessManager(2);

let transcriptionQueue = [];

export function startCallTranscription() {
  listenFiles();
  setInterval(newThread, UPDATE_INTERVAL);
}

function listenFiles() {
  setInterval(async () => {
    const dir = `${os.homedir()}/toTranscribe`;
    let files = await readdirAsync(dir);
    files = files.map((f) => `${dir}/${f}`);
    let notInQueue = files.filter((f) => !transcriptionQueue.includes(f));
    notInQueue = notInQueue.filter((f) => !pm.getProcesses().includes(f));
    transcriptionQueue = [...transcriptionQueue, ...notInQueue];
  }, UPDATE_INTERVAL);
}

async function newThread() {
  if (pm.isMaxed()) return;
  const path = transcriptionQueue.pop();
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
  chalk.blue(`transcribing ${fileName}`);
  const transcriptionPath = `${os.homedir()}/transcriptions`;
  const command = `whisper "${path}" --output_dir "${transcriptionPath}" --model tiny --output_format txt --language en`;
  await execAsync(command);
  execAsync(`rm "${path}"`);
  chalk.blue(`transcribed ${fileName}`);
  pm.stop(path);
  pm.cleanUp(path);
}

async function cleanUpFailedThread(path: string, e: Error) {
  chalk.yellow('Transcription Thread Failed');
  console.log(e);
  if (e.message.includes('Invalid data found when processing input')) {
    chalk.red('Deleting file as error is unrecoverable');
    execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }
  if (pm.getAmountOfTries(path) > 3) {
    chalk.red('Failed to transcribe file after 3 tries, deleting file');
    execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }

  pm.stop(path);
}
