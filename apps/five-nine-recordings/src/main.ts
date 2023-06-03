import chokidar from 'chokidar';
import os from 'os';
import { onQueueTick } from './on-queue-tick/on-queue-tick';
import { onFileAdd } from './on-file-add/on-file-add';

const watcher = chokidar.watch(`${os.homedir()}/recordings`);
watcher.on('add', (path) => console.log(path));

setInterval(() => {
  onQueueTick();
}, 1000);
