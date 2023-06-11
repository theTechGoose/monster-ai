import os from 'os';
import { readdir } from 'fs';
import { promisify } from 'util';
import { ProcessManager } from './process-manager';
import { exec } from 'child_process';
import { logger } from './logger';

const readdirAsync = promisify(readdir);
const execAsync = promisify(exec);

export type customExec = (path: string, pm: ProcessManager) => Promise<void>;
export type customCleanUp = (path: string, pm: ProcessManager) => Promise<boolean>;

export class Executor {
  constructor(private pm: ProcessManager) {}
  queue = [];
  private cleanUpFunc: customCleanUp = async () => true;
  private execFunc = null as unknown as customExec;

  registerCleanUp(func: customCleanUp) {
    this.cleanUpFunc = func;
  }

  registerExec(func: customExec) {
    this.execFunc = func;
  }

  start() {
    const folder = this.pm['process'];
    if (this.execFunc === null) {
      throw new Error(`Executor must have an exec function in ${folder}`);
    }

    this.listenFiles(folder);
    setInterval(this.newThread, this.pm.config.execInterval);
  }

  private listenFiles(folder: string) {
    setInterval(async () => {
      const dir = `${os.homedir()}/${folder}`;
      let files = await readdirAsync(dir);
      files = files.map((f) => `${dir}/${f}`);
      let notInQueue = files.filter((f) => !this.queue.includes(f));
      notInQueue = notInQueue.filter(
        (f) => !this.pm.getProcesses().includes(f)
      );
      this.queue = [...this.queue, ...notInQueue];
    }, this.pm.config.updateInterval);
  }

  private async newThread() {
    if (this.pm.isMaxed()) return;
    const path = this.queue.pop();
    if (!path) return;
    const { process } = this.pm.config;
    const fileName = this.pm.getFileName(path);
    this.pm.start(path);
    try {
      await this.execFunc(path, this.pm);
      await this.cleanUp(path, process, fileName);
    } catch (e) {
      logger.warn(`${fileName} ${process} failed with ${e.message}`);
      const runRetry = this.checkForRetries(path, fileName, process);
      if (runRetry) return;
      logger.error(
        `${fileName} ${process} failed the maximum number of times!`,
        e
      );
      this.cleanUp(path, process, fileName);
    }
  }

  checkForRetries(path: string, fileName: string, process: string) {
    const isMaxed = this.pm.getAmountOfTries(path) >= this.pm.config.maxRetries;
    if (isMaxed) return false;
    const runRetry = this.cleanUpFunc(path, this.pm);
    if (runRetry) {
      logger.debug(`${fileName} ${process} will be retried!`);
      this.pm.stop(path)
      return true;
    }
    return false;
  }

  private async cleanUp(path: string, process: string, fileName: string) {
    await execAsync(`rm "${path}"`);
    logger.info(`${fileName} ${process} finished! Deleted file`);
    this.pm.stop(path);
    this.pm.cleanUp(path);
  }
}
