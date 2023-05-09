const fs = require('fs');
const path = require('path');

export function findPackageJsonDir (startDir = process.cwd())  {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error('package.json not found in the directory tree');
    }

    currentDir = parentDir;
  }
};
