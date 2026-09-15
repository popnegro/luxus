const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(DIST_DIR)) process.exit(0);

const serviceAnchors = {
  'tab-institucional': 'comunicacion-institucional',
  'tab-medios': 'relaciones-con-medios',
  'tab-posicionamiento': 'posicionamiento-estrategico',
  'tab-reputacion': 'gestion-de-reputacion',
  'tab-crisis': 'comunicacion-de-crisis',
  'tab-asuntos': 'asuntos-publicos',
  'tab-contenidos': 'estrategia-de-contenidos',
  'tab-monitoreo': 'monitoreo-y-analisis'
};

for (const file of fs.readdirSync(DIST_DIR).filter((name) => name.endsWith('.html'))) {
  const filePath = path.join(DIST_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Use one deterministic stylesheet-loading strategy across all pages.
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="assets\/css\/main\.css([^>]*)"\s+media="print"\s+onload="this\.media='all'">/gi,
    '<link rel="stylesheet" href="assets/css/main.css$1">'
  );

  // Remove the obsolete empty critical-CSS placeholder left by legacy pages.
  html = html.replace(
    /\s*<style>\s*\/\* \.\.\. Aquí irían las reglas de CSS críticas[\s\S]*?<\/style>/gi,
    ''
  );

  // Normalize a known malformed SVG namespace in the services partial.
  html = html.replace(/http:\/\/www\.3\.000\.org\/2000\/svg/g, 'http://www.w3.org/2000/svg');

  // Expose service links with semantic, stable URL fragments instead of UI implementation names.
  for (const [technicalId, semanticId] of Object.entries(serviceAnchors)) {
    html = html.replaceAll(`servicios.html#${technicalId}`, `servicios.html#${semanticId}`);
  }

  // Keep the current tab implementation while adapting semantic service hashes to its technical IDs.
  if (file === 'servicios.html' && html.includes('assets/js/scripts.js') && !html.includes('assets/js/service-deep-links.js')) {
    html = html.replace(
      /<script\s+src="assets\/js\/scripts\.js"([^>]*)><\/script>/i,
      '<script src="assets/js/scripts.js"$1></script>\n    <script src="assets/js/service-deep-links.js" defer></script>'
    );
  }

  fs.writeFileSync(filePath, html);
}
