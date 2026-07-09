import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script de validación de integridad para Luxus Production.
 * Verifica que todos los archivos declarados en LUXUS_CONFIG.fragments existan en el disco.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = __dirname;
const SCRIPTS_PATH = path.join(ROOT_DIR, 'assets/js/scripts.js');

function getHtmlFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') getHtmlFiles(name, files);
        } else if (file.endsWith('.html')) {
            files.push(name);
        }
    }
    return files;
}

async function validate() {
    console.log('🔍 Iniciando Auditoría de Integridad de Fragmentos...');

    if (!fs.existsSync(SCRIPTS_PATH)) {
        console.error(`❌ No se encontró el archivo de configuración: ${SCRIPTS_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(SCRIPTS_PATH, 'utf8');
    const registryRegex = /'([^']+)':\s*{\s*file:\s*'([^']*)'/g;
    const registry = new Map();
    
    let match;
    while ((match = registryRegex.exec(content)) !== null) {
        registry.set(match[1], match[2]);
    }

    if (registry.size === 0) {
        console.warn('⚠️ No se encontraron fragmentos para validar en scripts.js');
        return;
    }

    // 1. Validar que los archivos configurados existen
    let missingCount = 0;
    registry.forEach((relativePath, id) => {
        if (!relativePath) return; // Omitir validación de archivo para placeholders internos (ej. breadcrumbs)
        const fullPath = path.join(ROOT_DIR, relativePath);

        if (!fs.existsSync(fullPath)) {
            console.error(`❌ Fragmento no encontrado: ${relativePath}`);
            missingCount++;
        }
    });

    // 2. Validar que los placeholders en el HTML estén registrados
    const htmlFiles = getHtmlFiles(ROOT_DIR);
    htmlFiles.forEach(file => {
        const html = fs.readFileSync(file, 'utf8');
        const placeholderRegex = /id=["']([^"']+-placeholder)["']/g;
        let pMatch;
        
        while ((pMatch = placeholderRegex.exec(html)) !== null) {
            const placeholderId = pMatch[1];
            if (!registry.has(placeholderId)) {
                console.error(`❌ ${path.relative(ROOT_DIR, file)}: Placeholder "${placeholderId}" no está definido en LUXUS_CONFIG.fragments`);
                missingCount++;
            }
        }
    });

    if (missingCount > 0) {
        console.error(`\n🚨 Error de Integridad: Se encontraron ${missingCount} problemas.`);
        process.exit(1);
    }

    console.log(`✨ Validación exitosa: ${registry.size} fragmentos y todos los archivos HTML verificados.\n`);
}

validate();