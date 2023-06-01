import { Controller, Get } from '@nestjs/common';

import { spawnSync, spawn } from 'child_process';
import { resolve } from 'path';

@Controller('deploy')
export class AppController {
  constructor() {}
  pid = null;

  @Get('exec')
  exec() {
    this.prepare();
    this.killServer();
    this.startServer();
  }

  @Get('prepare')
  prepare() {
    const command = spawnSync('git', ['pull'], {
      cwd: resolve(__dirname),
    });

    console.log(command.stdout.toString());
    console.log(command.stderr.toString());
    return { response: 'ok' };
  }

  @Get('kill')
  killServer() {
    if (this.pid) {
      const command = spawnSync('kill', [this.pid]);
      console.log(command.stdout.toString());
      console.log(command.stderr.toString());
    }
  }

  @Get('start')
  startServer() {
    const p = spawn('nx', ['serve', 'server']);
    p.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    p.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    this.pid = p.pid;
  }
}
