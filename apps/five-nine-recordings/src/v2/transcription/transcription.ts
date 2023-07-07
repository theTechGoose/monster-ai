import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { UPDATE_INTERVAL } from '../../main';
import { ProcessManager } from '../shared/process-manager';
import { exec } from 'child_process';
import chalk from 'chalk';
import {timeTracker} from './stats'
import { timer } from '../shared/timer';
import { getMetaData, setMetaData } from '../shared/data-manager';
import {getAudioDurationInSeconds} from 'get-audio-duration'

const MODELS = {
  tiny: 'tiny',
  base: 'base',
  medium: 'medium',
  large: 'large-v2'
}

const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);
const pm = new ProcessManager(3);

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
  await timeTracker(path)
  timer(path)
  const fileName = path.split('/').pop();
  console.log(chalk.blue(`transcribing ${fileName}`));
  const transcriptionPath = `${os.homedir()}/transcriptions`;
  const model = MODELS.large
  const threads = 5 
  const command = `PATH=/home/raphael/whisper_edit/bin:$PATH && whisperx "${path}" --output_dir "${transcriptionPath}" --model ${model} --output_format srt --language en --threads ${threads} --hf_token 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 --diarize --min_speakers 1 --max_speakers 2`;
  await execAsync(command);
  console.log('************************************')
  console.log(chalk.blue(`transcribed ${fileName}`))
  const stats = await timeTracker(path)
  const metaData = await getMetaData(path)
  const duration = await getAudioDurationInSeconds(path)
  metaData.recordingDuration = duration
  console.log('************************************')
  await execAsync(`rm "${path}"`);
  pm.stop(path);
  pm.cleanUp(path);
  const times = timer(path)
  metaData.times.transcribe = times
  metaData.model = model
  console.log({metaData})
  await setMetaData(metaData)
}

async function cleanUpFailedThread(path: string, e: Error) {
  const fileName = path.split('/').pop()
  console.log(chalk.yellow(`Transcription Thread Failed ${fileName}`));
  console.log(e)
  
  if (e.message.includes('Invalid data found when processing input')) {
    console.log(chalk.red('Deleting file as error is unrecoverable'));
    execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }
  
  if (pm.getAmountOfTries(path) > 3) {
    console.log(chalk.red('Failed to transcribe file after 3 tries, deleting file'));
    execAsync(`rm "${path}"`);
    pm.cleanUp(path);
    return;
  }

  pm.stop(path);
}
