import { spawn, execSync } from 'child_process';

function start() {
  const shell = spawn('node ./dist/apps/five-nine-recordings/main.js');
  shell.stdout.on('data', (data) => {
    console.log(data);
  });

  shell.stderr.on('data', (err) => {
    console.log('program closed, restarting...');
    start();
  });
}

function main() {
  execSync('nx build five-nine-recordings');
  start();
}
main();
