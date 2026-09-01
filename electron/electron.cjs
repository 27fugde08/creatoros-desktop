const path = require('path');
const fs = require('fs');

// Support tsx execution when running in development mode
try {
  require('tsx/cjs');
} catch (e) {}

const mainTsPath = path.join(__dirname, '../src/main/index.ts');
const mainJsPath = path.join(__dirname, '../dist/main/index.js');

if (fs.existsSync(mainTsPath)) {
  require(mainTsPath);
} else if (fs.existsSync(mainJsPath)) {
  require(mainJsPath);
} else {
  console.error('[Electron Launcher] Entry point missing: src/main/index.ts or dist/main/index.js');
}
