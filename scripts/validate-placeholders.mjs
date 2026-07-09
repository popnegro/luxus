import fs from 'fs';
import path from 'path';

const REQUIRED_PLACEHOLDERS = [
    'navigation-placeholder',
    'footer-placeholder',
    'contact-placeholder',
    'metodologia-placeholder'
];

const GLOBAL_ASSETS = [
    'assets/css/main.css', 
    'assets/js/scripts.js'
];

// Mapeo de archivos específicos que requieren dependencias adicionales
const CONDITIONAL_ASSETS = {
    'blog.html': ['assets/js/blog-engine.js'],
    'post.html': ['assets/js/post-loader.js']
};

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let hasErrors = false;

console.log('🔍 Validando integridad de HTML y dependencias (CSS/JS)...');

htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let fileErrors = [];

    // Helper para verificar existencia de archivo físico
    const verifyFileExists = (assetPath) => {
        const absolutePath = path.join(process.cwd(), assetPath);
        if (!fs.existsSync(absolutePath)) {
            fileErrors.push(`El archivo no existe en el disco: ${assetPath}`);
        }
    };

    // 1. Validar Placeholders de fragmentos
    const missing = REQUIRED_PLACEHOLDERS.filter(p => {
        // Excepciones para la Landing Page (index.html): 
        // No requiere navegación, footer ni contacto estándar.
        const isLanding = file === 'index.html' || file === 'luxus_index.html';
        if (isLanding && ['contact-placeholder', 'footer-placeholder', 'navigation-placeholder'].includes(p)) return false;

        // Home usa CTA como cierre de conversión y no monta el formulario de contacto.
        if (p === 'contact-placeholder' && file === 'home.html') return false;

        // Excepción: metodologia-placeholder no es obligatorio en index, post y blog
        if (p === 'metodologia-placeholder' && ['index.html', 'post.html', 'blog.html'].includes(file)) return false;

        return !content.includes(`id="${p}"`);
    });
    if (missing.length > 0) fileErrors.push(`Faltan placeholders: ${missing.join(', ')}`);

    // 2. Validar CSS y JS Globales
    GLOBAL_ASSETS.forEach(asset => {
        const isCSS = asset.endsWith('.css');
        // Escapamos los puntos del nombre del archivo para que el Regex los trate como literales
        const escapedAsset = asset.replace(/\./g, '\\.');
        
        const regex = isCSS 
            ? new RegExp(`href="'?${escapedAsset}["']`)
            : new RegExp(`src="'?${escapedAsset}["']`);
        
        if (!regex.test(content)) {
            fileErrors.push(`Falta link a dependencia global: ${asset}`);
        } else {
            verifyFileExists(asset);
        }
    });

    // 3. Validar dependencias específicas (Blog/Post)
    if (CONDITIONAL_ASSETS[file]) {
        CONDITIONAL_ASSETS[file].forEach(asset => {
            const escapedAsset = asset.replace(/\./g, '\\.');
            const regex = new RegExp(`src="'?${escapedAsset}["']`);
            if (!regex.test(content)) {
                fileErrors.push(`Falta dependencia específica: ${asset}`);
            } else {
                verifyFileExists(asset);
            }
        });
    }

    // 4. Validar form-handler.js si existe placeholder de formulario
    const hasFormPlaceholder = /id=["']form-placeholder["']/.test(content);
    // CORRECCIÓN: Escapamos todas las barras inclinadas en el Regex literal
    const hasFormHandler = /src="'?assets\/js\/form-handler\.js["']/.test(content);
    
    if (hasFormPlaceholder && !hasFormHandler) {
        fileErrors.push('Se detectó placeholder de formulario pero falta el script: assets/js/form-handler.js');
    } else if (hasFormHandler) {
        verifyFileExists('assets/js/form-handler.js');
    }

    if (fileErrors.length > 0) {
        console.error(`❌ ${file}:`);
        fileErrors.forEach(err => console.error(`   - ${err}`));
        hasErrors = true;
    } else {
        console.log(`✅ ${file} estructuralmente correcto.`);
    }
});

if (hasErrors) {
    console.log('\n⚠️ Se encontraron inconsistencias. Corrija los links antes de compilar.');
    process.exit(1);
} else {
    console.log('\n✨ Todos los archivos HTML están listos para producción.');
    process.exit(0);
}
