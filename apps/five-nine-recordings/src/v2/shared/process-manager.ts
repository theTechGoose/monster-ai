import { Executor, customExec } from './executor';

export interface processManagerConfigs {
  maxThreads?: number;
  process: string;
  updateInterval?: number;
  execInterval?: number;
  maxRetries?: number;
}
const defaultConfigs = {
  maxThreads: 1,
  updateInterval: 1000,
  maxRetries: 3,
};

export class ProcessManager {
  private processes = {};
  private executor = new Executor(this);

  get config() {
    return this._config;
  }

  constructor(private _config: processManagerConfigs) {
    if (!_config.process)
      throw new Error('ProcessManager must have a process name');
    const builtConfig: processManagerConfigs = {
      maxThreads: _config.maxThreads || defaultConfigs.maxThreads,
      process: _config.process,
      updateInterval: _config.updateInterval || defaultConfigs.updateInterval,
      execInterval: _config.execInterval || defaultConfigs.updateInterval,
      maxRetries: _config.maxRetries || defaultConfigs.maxRetries,
    };

    this._config = builtConfig;
  }

  registerCleanUp(func: customExec) {
    this.executor.registerCleanUp(func);
  }

  registerExec(func: customExec) {
    this.executor.registerExec(func);
    setTimeout(() => {
      this.executor.start();
    }, 100);
  }

  isMaxed() {
    const processEntries = Object.entries(this.processes) as unknown as {
      count: number;
      isLive: boolean;
    }[];
    const currentThreads = processEntries.reduce((acc, val) => {
      const isLive = val[1].isLive;
      if (!isLive) return acc;
      return acc + 1;
    }, 0);
    return currentThreads >= this.config.maxThreads;
  }

  getAmountOfTries(id: string) {
    return this.processes[id].count;
  }

  getProcesses() {
    return Object.keys(this.processes);
  }

  getFileName(path: string) {
    return path.split('/').pop();
  }

  start(id: string) {
    if (!this.processes[id]) this.processes[id] = { count: 0 };
    this.processes[id].isLive = true;
    this.processes[id].count++;
    return id;
  }

  stop(id: string) {
    this.processes[id].isLive = false;
    return id;
  }

  cleanUp(id: string) {
    delete this.processes[id];
    return id;
  }
}
