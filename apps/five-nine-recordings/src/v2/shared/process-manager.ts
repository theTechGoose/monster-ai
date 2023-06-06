
export class ProcessManager {
  private processes = {};
  constructor(private maxThreads: number) {}

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
    return currentThreads > this.maxThreads;
  }

  getAmountOfTries(id: string) {
    return this.processes[id].count;
  }

  getProcesses() {
    return Object.keys(this.processes)
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

