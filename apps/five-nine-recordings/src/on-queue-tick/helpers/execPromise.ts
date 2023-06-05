
const { spawn } = require('child_process');

export function spawnPromise(...command) {
    return new Promise((resolve, reject) => {
        const child = spawn(...command);
        child.on('error', reject);
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Exited with code ${code} and signal ${signal}`));
            }
        });
    });
}

