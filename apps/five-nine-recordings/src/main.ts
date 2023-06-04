import 'dotenv/config';
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
