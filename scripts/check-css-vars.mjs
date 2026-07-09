import fs from 'node:fs';
import path from 'node:path';

const CSS_FILE = './assets/css/main.css';

if (!fs.existsSync(CSS_FILE)) {
    console.error(`❌ Error: El archivo ${CSS_FILE} no existe. Ejecuta 'npm run tailwind:build' primero.`);
    process.exit(1);
}

const content = fs.readFileSync(CSS_FILE, 'utf8');

// Propiedades críticas que Autoprefixer o cssnano podrían eliminar/alterar
const CRITICAL_PROPS = [
    { name: '-webkit-box-orient', pattern: /-webkit-box-orient:\s*vertical/ },
    { name: '-webkit-line-clamp', pattern: /-webkit-line-clamp:\s*3/ },
    { name: 'radial-gradient', pattern: /radial-gradient/ }
];

// Variables que sabemos que se inyectan dinámicamente o son gestionadas por el engine
const IGNORE_VARS = [
    '--tw-shadow-color',
    '--mouse-x',
    '--mouse-y',
    '--color-slate-950',
    '--color-slate-950-rgb',
    '--color-accent-blue-rgb'
];

// 1. Extraer todas las variables definidas: --variable-name:
const definedVars = new Set();
const definitionRegex = /(--[a-zA-Z0-9-_]+)\s*:/g;
let match;
while ((match = definitionRegex.exec(content)) !== null) {
    definedVars.add(match[1]);
}

// 2. Extraer todas las variables utilizadas: var(--variable-name)
const usedVars = new Set();
const usageRegex = /var\(\s*(--[a-zA-Z0-9-_]+)/g;
while ((match = usageRegex.exec(content)) !== null) {
    usedVars.add(match[1]);
}

// 3. Comparar
const missing = [...usedVars].filter(v => 
    !definedVars.has(v) && !IGNORE_VARS.includes(v)
);

console.log(`\n--- Auditoría de Variables en ${CSS_FILE} ---`);
console.log(`✅ Definiciones: ${definedVars.size}`);
console.log(`✅ Usos: ${usedVars.size}`);

// 4. Verificar propiedades críticas
console.log(`\n--- Auditoría de Propiedades Críticas ---`);
CRITICAL_PROPS.forEach(prop => {
    const isPresent = prop.pattern.test(content);
    console.log(`${isPresent ? '✅' : '❌'} ${prop.name}: ${isPresent ? 'Preservada' : 'ELIMINADA'}`);
    if (!isPresent) process.exitCode = 1;
});

// 5. Resultado final de variables
if (missing.length > 0) {
    console.error(`\n❌ ERROR: Se detectaron ${missing.length} variables huérfanas (usadas pero no definidas):`);
    missing.forEach(v => console.log(`   - ${v}`));
    process.exit(1);
} else {
    console.log(`\n✨ Integridad de variables confirmada: 0 huérfanas.\n`);
}