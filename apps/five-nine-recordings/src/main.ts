import * as env from 'dotenv';
import { join } from 'path';
const envPath = join(__dirname, '../../..', '.env');
console.log(envPath);

env.config({ path: envPath });

import chokidar from 'chokidar';
import os from 'os';
import {
  onQueueTick,
  reset,
  currentState,
} from './on-queue-tick/on-queue-tick';
import { onFileAdd } from './on-file-add/on-file-add';

const watcher = chokidar.watch(`${os.homedir()}/recordings`);
watcher.on('add', onFileAdd);

process.on('unhandledRejection', () => {
  console.log('unhandled rejection!');
  console.log('resetting state!');
  process.exit(1);
});

setInterval(async () => {
  try {
    await onQueueTick();
  } catch (e) {
    console.log('unable to transcribe recording!');
    console.log(e);
    currentState.forEach((p) => {
      onFileAdd(p, 'back');
    });
    reset();
  }
}, 1000);
