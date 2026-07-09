import { promises as fs, existsSync } from 'fs';
import path from 'path';

const DIST_DIR = './dist';
const BUILD_ID = Date.now().toString();

async function prepare() {
    console.log(`🔧 Preparando entorno de producción (BUILD_ID: ${BUILD_ID})...`);

    // 1. Inyectar configuración de Producción en scripts.js
    const scriptsPath = path.join(DIST_DIR, 'assets/js/scripts.js');
    if (existsSync(scriptsPath)) {
        let content = await fs.readFile(scriptsPath, 'utf8');
        // Reemplazamos el BUILD_ID y conservamos detección local para previews en localhost.
        content = content.replace(/\bBUILD_ID\s*=\s*['"][^'"]+['"]/, `BUILD_ID='${BUILD_ID}'`);
        await fs.writeFile(scriptsPath, content);
        console.log('✅ Configuración inyectada en scripts.js');
    }

    // 2. Cache Busting en archivos HTML
    const htmlFiles = (await fs.readdir(DIST_DIR)).filter(f => f.endsWith('.html'));
    for (const file of htmlFiles) {
        const filePath = path.join(DIST_DIR, file);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Versionado de CSS
        content = content.replace(/assets\/css\/main\.css(\?v=[^"']*)?/g, `assets/css/main.css?v=${BUILD_ID}`);
        // Versionado de JS
        content = content.replace(/assets\/js\/([^"'\s?]+)\.js(\?v=[^"']*)?/g, (match, p1) => {
            const cleanPath = p1.split('?')[0];
            return `assets/js/${cleanPath}.js?v=${BUILD_ID}`;
        });
        
        await fs.writeFile(filePath, content);
    }
    console.log(`✅ Cache busting aplicado a ${htmlFiles.length} archivos HTML`);
}

prepare().catch(err => { console.error(err); process.exit(1); });
