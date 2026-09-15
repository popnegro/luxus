const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const requiredFiles = [
  'index.html',
  '404.html',
  'blog.html',
  'contacto.html',
  'metodologia.html',
  'nosotros.html',
  'servicios.html',
  'robots.txt',
  'sitemap.xml',
];

let hasErrors = false;
const fail = (message) => {
  console.error(`❌ ${message}`);
  hasErrors = true;
};

console.log('🔎 Validando artefactos de producción...');

if (!fs.existsSync(DIST_DIR)) {
  fail('No existe dist/. Ejecuta npm run build.');
  process.exit(1);
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(DIST_DIR, file))) fail(`Falta el archivo requerido: dist/${file}`);
}

const htmlFiles = fs.readdirSync(DIST_DIR).filter((file) => file.endsWith('.html'));
if (htmlFiles.length === 0) fail('No se encontraron páginas HTML en dist/.');

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');

  if (!/^<!doctype html>/i.test(html.trim())) fail(`${file}: no comienza con un doctype HTML válido.`);
  if (/data-fragment\s*=/.test(html)) fail(`${file}: contiene placeholders data-fragment sin prerenderizar.`);
  if (/<script[^>]+src=["']server\.js["']/i.test(html)) fail(`${file}: referencia server.js inexistente.`);
  if (/href=""/.test(html)) fail(`${file}: contiene un anchor con href vacío.`);
  if (/http:\/\/www\.3\.000\.org\/2000\/svg/.test(html)) fail(`${file}: contiene un namespace SVG inválido.`);
  if (/assets\/css\/main\.css[^>]*media="print"/.test(html)) fail(`${file}: conserva la estrategia CSS async heredada.`);
}

if (!fs.existsSync(path.join(DIST_DIR, 'assets'))) fail('Falta dist/assets/.');

if (hasErrors) {
  console.error('❌ Validación de producción fallida.');
  process.exit(1);
}

console.log(`✅ Validación correcta: ${htmlFiles.length} páginas HTML verificadas.`);
