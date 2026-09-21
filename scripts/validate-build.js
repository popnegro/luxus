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

const serviceAnchors = [
  'comunicacion-institucional',
  'relaciones-con-medios',
  'posicionamiento-estrategico',
  'gestion-de-reputacion',
  'comunicacion-de-crisis',
  'asuntos-publicos',
  'estrategia-de-contenidos',
  'monitoreo-y-analisis',
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

const htmlFiles = fs.readdirSync(DIST_DIR).filter((file) => file.endsWith('.html');
if (htmlFiles.length === 0) fail('No se encontraron páginas HTML en dist/.');

const renderedHtml = htmlFiles.map((file) => fs.readFileSync(path.join(DIST_DIR, file), 'utf8')).join('\n');

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');

  if (!/^<!doctype html>/i.test(html.trim())) fail(`${file}: no comienza con un doctype HTML válido.`);
  if (/data-fragment\s*=/.test(html)) fail(`${file}: contiene placeholders data-fragment sin prerenderizar.`);
  if (/<script[^>]+src=["']server\.js["']/i.test(html)) fail(`${file}: referencia server.js inexistente.`);
  if (/href=""/.test(html)) fail(`${file}: contiene un anchor con href vacío.`);
  if (/http:\/\/www\.3\.000\.org\/2000\/svg/.test(html)) fail(`${file}: contiene un namespace SVG inválido.`);
  if (/assets\/css\/main\.css[^>]*media="print"/.test(html)) fail(`${file}: conserva la estrategia CSS async heredada.`);
}

for (const anchor of serviceAnchors) {
  if (!renderedHtml.includes(`servicios.html#${anchor}`)) {
    fail(`Build: falta el anchor semántico #${anchor}.`);
  }
}
if (/servicios\.html#tab-[a-z-]+/i.test(renderedHtml)) {
  fail('Build: conserva anchors públicos con el prefijo técnico #tab-.');
}

const servicesHtml = fs.readFileSync(path.join(DIST_DIR, 'servicios.html'), 'utf8');
if (!servicesHtml.includes('assets/js/service-deep-links.js')) {
  fail('servicios.html: falta el adaptador de deep links semánticos.');
}

if (!fs.existsSync(path.join(DIST_DIR, 'assets'))) fail('Falta dist/assets/.');

if (hasErrors) {
  console.error('❌ Validación de producción fallida.');
  process.exit(1);
}

console.log(`✅ Validación correcta: ${htmlFiles.length} páginas HTML verificadas.`);
