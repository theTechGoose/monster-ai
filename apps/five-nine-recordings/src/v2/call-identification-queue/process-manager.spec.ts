export class ProcessManager {
  private processes = {};
  constructor(private maxThreads: number) {}

  isMaxed() {
    const processEntries = Object.entries(this.processes) as unknown as {
      count: number;
      isLive: boolean;
    }[];
    const currentThreads = processEntries.reduce((acc, val) => {
      console.log({ val });
      const isLive = val[1].isLive;
      if (!isLive) return acc;
      return acc + 1;
    }, 0);
    console.log({ currentThreads, maxThreads: this.maxThreads });
    return currentThreads >= this.maxThreads;
  }

  getAmountOfTries(id: string) {
    return this.processes[id].count;
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

describe('process manager', () => {
  it('should work', () => {
    console.log('test');
    expect(true).toBe(true);
  });

  it('should start a process', () => {
    const pm = new ProcessManager(2);
    const id = pm.start('test');
    pm.start('test');
    console.log(pm['processes']);
    expect(id).toBe('test');
  });

  it('should stop a process', () => {
    const pm = new ProcessManager(2);
    const id = pm.start('test');
    pm.start('test');
    pm.stop('test');
    console.log(pm['processes']);
    expect(id).toBe('test');
  });

  it('should not allow more than the base proceses to be alive at the same time', () => {
    const pm = new ProcessManager(2);
    pm.start('test');
    pm.start('test2');
    console.log(pm['processes']);
    const isMaxed = pm.isMaxed();
    expect(isMaxed).toBe(true);
  });
});
