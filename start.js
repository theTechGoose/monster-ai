const { spawn, execSync } = require('child_process');
const path = require('path');

function start() {
  const pathToApp = path.join(
    __dirname,
    'dist/apps/five-nine-recordings/main.js'
  );
  const shell = spawn(pathToApp);
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
