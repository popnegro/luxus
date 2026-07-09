import fs from 'node:fs';

const THEME_FILE = './assets/css/theme.css';
const CONFIG_FILE = './tailwind.config.js';

const requiredTokens = [
    '--color-bg-main',
    '--color-bg-secondary',
    '--color-text-main',
    '--color-text-muted',
    '--color-text-dim',
    '--color-accent-blue',
    '--color-luxus-blue',
    '--color-luxus-green',
    '--color-luxus-orange',
    '--color-luxus-purple',
    '--text-tiny',
    '--text-micro',
    '--radius-standard',
    '--radius-large',
    '--duration-base',
    '--duration-smooth',
    '--ease-smooth',
    '--gradient-energy',
    '--font-poppins'
];

const fail = (message, details = []) => {
    console.error(`\n❌ ${message}`);
    details.forEach(detail => console.error(`   - ${detail}`));
    process.exit(1);
};

if (!fs.existsSync(THEME_FILE)) {
    fail(`No se encuentra el archivo de tema Tailwind: ${THEME_FILE}`);
}

const css = fs.readFileSync(THEME_FILE, 'utf8');

if (!/@theme\s*\{/.test(css)) {
    fail('No se encontró el bloque @theme requerido por Tailwind v4.', [
        'Define los tokens de diseño en assets/css/tailwind-layers.css.'
    ]);
}

const missingTokens = requiredTokens.filter(token => !new RegExp(`${token}\\s*:`).test(css));

if (missingTokens.length > 0) {
    fail('Faltan tokens críticos del sistema visual.', missingTokens);
}

if (fs.existsSync(CONFIG_FILE)) {
    const config = fs.readFileSync(CONFIG_FILE, 'utf8');
    const hasLegacyThemeExtension = /theme\s*:\s*\{[\s\S]*(extend\s*:|colors\s*:|fontFamily\s*:|borderRadius\s*:)/.test(config);

    if (hasLegacyThemeExtension) {
        fail('tailwind.config.js contiene configuración de tema legacy.', [
            'En Tailwind v4 este proyecto centraliza los tokens en CSS mediante @theme.'
        ]);
    }
}

console.log('\n--- Auditoría de Tema Tailwind ---');
console.log(`✅ Archivo de tema: ${THEME_FILE}`);
console.log(`✅ Bloque @theme detectado.`);
console.log(`✅ Tokens críticos: ${requiredTokens.length}/${requiredTokens.length}`);
console.log('✨ Tema Tailwind v4 validado.\n');
