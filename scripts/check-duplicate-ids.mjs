import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const HTML_FILES_PATTERN = [
    './*.html',
    './assets/partials/**/*.html'
];

console.log('\n--- Auditoría de IDs Duplicados en Archivos HTML ---');

const allFiles = globSync(HTML_FILES_PATTERN);
let hasDuplicates = false;

if (allFiles.length === 0) {
    console.warn('⚠️ Advertencia: No se encontraron archivos HTML para auditar.');
    process.exit(0);
}

for (const filePath of allFiles) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const idRegex = /id="((?!.*-placeholder)[a-zA-Z0-9_-]+)"/g;
        const idsInFile = new Map();
        let match;

        while ((match = idRegex.exec(content)) !== null) {
            const id = match[1];
            const line = content.slice(0, match.index).split('\n').length;

            if (idsInFile.has(id)) {
                idsInFile.get(id).push(line);
            } else {
                idsInFile.set(id, [line]);
            }
        }

        for (const [id, lines] of idsInFile.entries()) {
            if (lines.length > 1) {
                console.error(`❌ ERROR: ID duplicado encontrado en ${filePath}: "${id}"`);
                console.error(`   Líneas: ${lines.join(', ')}`);
                hasDuplicates = true;
            }
        }
    } catch (error) {
        console.error(`❌ Error al leer el archivo ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

if (hasDuplicates) {
    process.exit(1);
} else {
    console.log('✨ Integridad de IDs confirmada.');
    process.exit(0);
}
