const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const versionData = {
  version: pkg.version || '1.2.0',
  buildTime: new Date().toISOString(),
  timestamp: Date.now()
};

const targetPath = path.resolve(__dirname, '../public/version.json');
fs.writeFileSync(targetPath, JSON.stringify(versionData, null, 2), 'utf-8');
console.log(`[Version Generator] Generated public/version.json with version ${versionData.version} (${versionData.buildTime})`);
