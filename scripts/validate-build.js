const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const requiredFiles = ['index.html', 'robots.txt', 'sitemap.xml'];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

console.log('🔎 Validando artefactos de producción...');

if (!fs.existsSync(DIST_DIR)) {
  fail('No existe dist/. Ejecuta npm run build.');
  process.exit();
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(DIST_DIR, file))) {
    fail(`Falta el archivo requerido: dist/${file}`);
  }
}

const htmlFiles = fs
  .readdirSync(DIST_DIR)
  .filter((file) => file.endsWith('.html'));

if (htmlFiles.length === 0) {
  fail('No se encontraron páginas HTML en dist/.');
}

for (const file of htmlFiles) {
  const filePath = path.join(DIST_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');

  if (!/^<!doctype html>/i.test(html.trim())) {
    fail(`${file}: no comienza con un doctype HTML válido.`);
  }

  if (/data-fragment\s*=/.test(html)) {
    fail(`${file}: contiene placeholders data-fragment sin prerenderizar.`);
  }

  if (/<script[^>]+src=["']server\.js["']/i.test(html)) {
    fail(`${file}: referencia server.js, pero la aplicación no contiene ese entrypoint.`);
  }
}

if (!fs.existsSync(path.join(DIST_DIR, 'assets'))) {
  fail('Falta dist/assets/.');
}

if (process.exitCode) {
  console.error('❌ Validación de producción fallida.');
} else {
  console.log(`✅ Validación correcta: ${htmlFiles.length} páginas HTML verificadas.`);
}
