const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(DIST_DIR)) process.exit(0);

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

  fs.writeFileSync(filePath, html);
}
