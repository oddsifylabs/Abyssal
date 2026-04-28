const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.resolve(__dirname, '../../apps/web/public/sprites');

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.svg'));
files.forEach(f => {
  fs.copyFileSync(path.join(SRC, f), path.join(DEST, f));
});

console.log(`Copied ${files.length} sprites to ${DEST}`);
