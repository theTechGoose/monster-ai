import 'dotenv/config';
import chokidar from 'chokidar';
import os from 'os';
import { onQueueTick } from './on-queue-tick/on-queue-tick';
import { onFileAdd } from './on-file-add/on-file-add';

const watcher = chokidar.watch(`${os.homedir()}/recordings`);
watcher.on('add', onFileAdd);

setInterval(async () => {
  try {
    await onQueueTick();
  } catch (e) {
    console.log('********************************************');
    console.log('this should never happen');
    console.log('********************************************');
    console.log(e);
  }
}, 1000);
