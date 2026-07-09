import { readFileSync, writeFileSync } from 'node:fs';

const file = 'assets/css/main.css';
const css = readFileSync(file, 'utf8').replace(/^\/\*! tailwindcss[^*]*\*\/\s*/, '');

writeFileSync(file, css);
