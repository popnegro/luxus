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

if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ No existe el directorio de build: ${DIST_DIR}`);
  process.exit(1);
}

for (const file of requiredFiles) {
  const filePath = path.join(DIST_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Falta archivo requerido: dist/${file}`);
    hasErrors = true;
  }
}

for (const file of fs.readdirSync(DIST_DIR).filter((name) => name.endsWith('.html'))) {
  const filePath = path.join(DIST_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');

  if (/data-fragment\s*=/.test(html)) {
    console.error(`❌ Quedó un placeholder data-fragment sin compilar: dist/${file}`);
    hasErrors = true;
  }

  if (!/<html\b/i.test(html) || !/<\/html>/i.test(html)) {
    console.error(`❌ HTML inválido o incompleto: dist/${file}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('✅ Build validado correctamente.');
