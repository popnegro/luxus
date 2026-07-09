import fs from 'fs';
import path from 'path';

// Soporte para auditar directorios específicos vía argumentos
const TARGET_DIR = process.argv.includes('--dir') ? process.argv[process.argv.indexOf('--dir') + 1] : './';
const PARTIALS_DIR = path.join(TARGET_DIR, 'assets/partials/');
const ROOT_DIR = TARGET_DIR;
const HERO_PARTIAL = 'hero-section.html';

const getHtmlFiles = (dir) => fs.readdirSync(dir).filter(f => f.endsWith('.html'));

/**
 * Audita un archivo HTML buscando problemas de SEO y Core Web Vitals
 */
function auditFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    let fileErrors = 0;

    // 1. Auditoría de H1
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    const h1Count = (content.match(h1Regex) || []).length;

    // 2. Auditoría de Imágenes (SEO + Core Web Vitals)
    const imgRegex = /<img\s+([^>]+)>/gi;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
        const tag = match[0];
        const attributes = match[1];

        const hasAlt = /\balt=["']/.test(attributes);
        const hasTitle = /\btitle=["']/.test(attributes);
        const hasWidth = /\bwidth=["']\d+["']/.test(attributes);
        const hasHeight = /\bheight=["']\d+["']/.test(attributes);

        if (!hasAlt) {
            console.error(`❌ [Accesibilidad]: Imagen sin atributo 'alt' en ${fileName} -> ${tag}`);
            fileErrors++;
        }
        if (!hasTitle) {
            console.error(`⚠️  [SEO/UX]: Imagen sin atributo 'title' en ${fileName} -> ${tag}`);
            // No bloqueamos el build por title, pero avisamos
        }
        if (!hasWidth || !hasHeight) {
            console.error(`❌ [CLS/Performance]: Imagen sin dimensiones explícitas (width/height) en ${fileName}. Esto causa saltos de diseño. -> ${tag}`);
            fileErrors++;
        }
    }

    // 3. Auditoría de Integridad del <head>
    const headMatch = content.match(/<head>([\s\S]*?)<\/head>/i);
    if (headMatch) {
        const headContent = headMatch[1];
        fileErrors += auditHeadIntegrity(headContent, fileName);
    } else if (!filePath.includes('assets/partials')) {
        console.error(`❌ [Estructura]: No se encontró la etiqueta <head> en ${fileName}`);
        fileErrors++;
    }

    return { h1Count, fileErrors };
}

/**
 * Valida que el head contenga los elementos semánticos esenciales
 */
function auditHeadIntegrity(headContent, fileName) {
    let headErrors = 0;
    const requirements = [
        { name: 'Charset UTF-8', regex: /<meta[^>]*charset=["']?utf-8["']?/i },
        { name: 'Viewport', regex: /<meta[^>]*name=["']viewport["']/i },
        { name: 'Meta Description', regex: /<meta[^>]*name=["']description["']/i },
        { name: 'Canonical Link', regex: /<link[^>]*rel=["']canonical["']/i },
        { name: 'OG Title', regex: /<meta[^>]*property=["']og:title["']/i },
        { name: 'OG Image', regex: /<meta[^>]*property=["']og:image["']/i },
        { name: 'Favicon', regex: /<link[^>]*rel=["']icon["']/i }
    ];

    requirements.forEach(req => {
        if (!req.regex.test(headContent)) {
            console.error(`❌ [Head Integrity]: Falta etiqueta '${req.name}' en ${fileName}`);
            headErrors++;
        }
    });

    // Validación de orden: Charset debería estar en las primeras 1024 bytes
    const charsetIndex = headContent.toLowerCase().indexOf('charset');
    const titleIndex = headContent.toLowerCase().indexOf('<title');
    
    if (titleIndex !== -1 && charsetIndex > titleIndex) {
        console.warn(`⚠️  [Performance]: En ${fileName}, el Charset debería ir ANTES del Title para optimizar el parseo.`);
    }

    return headErrors;
}

console.log('🧐 Iniciando auditoría de SEO, Core Web Vitals e Integridad de Head...');

const rootFiles = getHtmlFiles(ROOT_DIR);
const partialFiles = getHtmlFiles(PARTIALS_DIR);
let errors = 0;

// 1. Verificar si el partial del Hero tiene el H1 (es donde debería estar en tu arquitectura)
const heroPath = path.join(PARTIALS_DIR, HERO_PARTIAL);
let heroHasH1 = false;
let heroAudit = { h1Count: 0, fileErrors: 0 };

if (fs.existsSync(heroPath)) {
    heroAudit = auditFile(heroPath);
    errors += heroAudit.fileErrors;

    if (heroAudit.h1Count === 1) {
        heroHasH1 = true;
        console.log(`✅ Hero partial contiene el H1 principal.`);
    } else if (heroAudit.h1Count > 1) {
        console.error(`❌ ERROR: El archivo ${HERO_PARTIAL} tiene más de un <h1>.`);
        errors++;
    }
}

// 2. Verificar páginas raíz
rootFiles.forEach(file => {
    const filePath = path.join(ROOT_DIR, file);
    const { h1Count, fileErrors } = auditFile(filePath);
    errors += fileErrors;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const hasHeroPlaceholder = content.includes('hero-placeholder') || content.includes('post-content');

    if (h1Count === 0 && !hasHeroPlaceholder) {
        console.error(`❌ ERROR: ${file} no tiene <h1> ni hero-placeholder.`);
        errors++;
    } else if (h1Count > 1) {
        console.error(`❌ ERROR: ${file} tiene múltiples <h1>. Solo debe haber uno por página.`);
        errors++;
    }
});

// 3. Auditar el resto de los partials para imágenes
partialFiles.forEach(file => {
    if (file === HERO_PARTIAL) return; // Ya auditado
    const { fileErrors } = auditFile(path.join(PARTIALS_DIR, file));
    errors += fileErrors;
});

if (errors > 0) {
    console.error(`\n💥 Fallo en la validación: Se encontraron ${errors} problemas de SEO/CWV.`);
    process.exit(1);
} else {
    console.log('✨ Validación completada: Estructura semántica y Core Web Vitals correctos.\n');
}