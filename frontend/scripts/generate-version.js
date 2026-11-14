const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const versionData = {
  version: pkg.version || '1.4.1',
  buildTime: new Date().toISOString(),
  timestamp: Date.now()
};

const targetPath = path.resolve(__dirname, '../public/version.json');
fs.writeFileSync(targetPath, JSON.stringify(versionData, null, 2), 'utf-8');
console.log(`[Version Generator] Generated public/version.json with version ${versionData.version} (${versionData.buildTime})`);

const swPath = path.resolve(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  const cacheName = `da-cache-v${versionData.version}`;
  const updatedSw = swContent.replace(
    /const CURRENT_CACHE_NAME = ['"][^'"]+['"];/,
    `const CURRENT_CACHE_NAME = '${cacheName}';`
  );
  if (updatedSw !== swContent) {
    fs.writeFileSync(swPath, updatedSw, 'utf-8');
    console.log(`[Version Generator] Synchronized sw.js cache name to ${cacheName}`);
  }
}
