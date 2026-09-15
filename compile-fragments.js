const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');

console.log('⚡ Compilando y pre-renderizando fragmentos HTML...');

if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ El directorio de distribución '${DIST_DIR}' no existe.`);
  process.exit(1);
}

// Obtener todas las páginas HTML en dist/
const files = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(DIST_DIR, file);
  let htmlContent = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Buscar placeholders incluso cuando el cierre de <div> está separado por espacios o saltos de línea.
  const divRegex = /<div\s+([^>]*data-fragment="([^"]+)"[^>]*)>\s*<\/div>/g;

  htmlContent = htmlContent.replace(divRegex, (fullMatch, attrs, fragPath) => {
    const fullFragPath = path.join(DIST_DIR, fragPath);

    if (fs.existsSync(fullFragPath)) {
      console.log(`   - Enlazando fragmento: ${fragPath} -> ${file}`);
      const fragContent = fs.readFileSync(fullFragPath, 'utf8');
      hasChanges = true;

      // Mantener id y clases para preservar estilos y selectores JS.
      const idMatch = attrs.match(/id="([^"]+)"/);
      const idAttr = idMatch ? ` id="${idMatch[1]}"` : '';
      const classMatch = attrs.match(/class="([^"]+)"/);
      const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';

      return `<div${idAttr}${classAttr}>\n${fragContent}\n</div>`;
    }

    console.warn(`   ⚠️ Fragmento no encontrado: ${fullFragPath}`);
    return fullMatch;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, htmlContent, 'utf8');
  }
});

console.log('✅ Fragmentos pre-renderizados con éxito.');
