const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
let hasErrors = false;

console.log('⚡ Compilando y pre-renderizando fragmentos HTML...');

if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ El directorio de distribución '${DIST_DIR}' no existe.`);
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR).filter((file) => file.endsWith('.html'));

files.forEach((file) => {
  const filePath = path.join(DIST_DIR, file);
  let htmlContent = fs.readFileSync(filePath, 'utf8');
  let fileChanged = false;

  const divRegex = /<div\s+([^>]*data-fragment="([^"]+)"[^>]*)>\s*<\/div>/g;

  htmlContent = htmlContent.replace(divRegex, (fullMatch, attrs, fragPath) => {
    const fullFragPath = path.join(DIST_DIR, fragPath);

    if (!fs.existsSync(fullFragPath)) {
      console.error(`   ❌ Fragmento no encontrado: ${fullFragPath} (referenciado desde ${file})`);
      hasErrors = true;
      return fullMatch;
    }

    console.log(`   - Enlazando fragmento: ${fragPath} -> ${file}`);
    const fragContent = fs.readFileSync(fullFragPath, 'utf8');
    fileChanged = true;

    const idMatch = attrs.match(/id="([^"]+)"/);
    const idAttr = idMatch ? ` id="${idMatch[1]}"` : '';
    const classMatch = attrs.match(/class="([^"]+)"/);
    const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';

    return `<div${idAttr}${classAttr}>\n${fragContent}\n</div>`;
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, htmlContent, 'utf8');
  }
});

if (hasErrors) {
  console.error('❌ El build se detiene porque existen fragmentos HTML faltantes.');
  process.exit(1);
}

console.log('✅ Fragmentos pre-renderizados con éxito.');
