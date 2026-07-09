import { copyFileSync, statSync } from 'node:fs';

const source = 'assets/css/luxus-public-main.css';
const target = 'assets/css/main.css';

copyFileSync(source, target);

const sourceSize = statSync(source).size;
const targetSize = statSync(target).size;

if (sourceSize !== targetSize) {
    throw new Error(`CSS sync failed: ${source} (${sourceSize}) != ${target} (${targetSize})`);
}

console.log(`✅ CSS sincronizado con snapshot público (${targetSize} bytes).`);
