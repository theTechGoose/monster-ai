import 'dotenv/config';
import chokidar from 'chokidar';
import os from 'os';
import { onQueueTick } from './on-queue-tick/on-queue-tick';
import { onFileAdd } from './on-file-add/on-file-add';

const watcher = chokidar.watch(`${os.homedir()}/recordings`);
watcher.on('add', onFileAdd);

setInterval(() => {
  try {
    onQueueTick();
  } catch (e) {
    console.log('unable to transcribe recording!');
    console.log(e);
  }
}, 1000);
