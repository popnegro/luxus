import { promises as fs, existsSync } from 'fs';
import path from 'path';
import assert from 'assert';

const DIST_CSS = path.resolve('dist/assets/css/main.css');
const DIST_JS = path.resolve('dist/assets/js/scripts.js');

async function listFiles(dir, depth = 0) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            console.log(`${'  '.repeat(depth)}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
            if (entry.isDirectory()) {
                await listFiles(res, depth + 1);
            }
        }
    } catch (e) {
        console.log(`${'  '.repeat(depth)}❌ No se pudo leer: ${dir}`);
    }
}

async function runTests() {
    console.log('🧪 Ejecutando Pruebas de Integridad de Producción...');

    try {
        // Verificación preventiva de existencia
        const distDir = path.resolve('dist');
        if (!existsSync(DIST_CSS)) {
            console.error(`\n💥 ERROR CRÍTICO: No se encuentra el archivo CSS en: ${DIST_CSS}`);
            if (existsSync(distDir)) {
                console.log('\nEstructura actual detectada en /dist:');
                await listFiles(distDir);
            } else {
                console.error('❌ El directorio /dist no existe. El comando "npm run copy" pudo haber fallado o no encontró archivos para copiar.');
            }
            process.exit(1);
        }

        // 1. Validar el Build de CSS
        const css = await fs.readFile(DIST_CSS, 'utf8');
        assert.ok(css.includes('--tw-scale-x'), 'Error: Faltan variables base del motor Tailwind.');
        assert.ok(css.includes('-webkit-appearance:none'), 'Error: Los resets críticos de CSS desaparecieron.');
        const hasComments = css.includes('/*');
        assert.strictEqual(hasComments, false, `Error: El CSS contiene comentarios (${css.match(/\/\*[\s\S]*?\*\//g)?.[0]?.substring(0, 20)}...).`);
        console.log('✅ CSS Production Build: Validado.');

        // 2. Validar Configuración de Producción en JS
        const js = await fs.readFile(DIST_JS, 'utf8');
        // Verificamos que el preview local no contamine Analytics ni cachés de producción.
        assert.ok(js.includes('isLocal') && js.includes('localhost'), 'Error: Falta detección local para previews seguros.');

        // Verificamos que el BUILD_ID del runtime coincide con el cache busting de HTML
        const buildIdMatch = js.match(/\bBUILD_ID\s*=\s*['"]([^'"]+)['"]/);
        assert.ok(buildIdMatch, 'Error: No se encontró BUILD_ID en scripts.js.');
        const html = await fs.readFile(path.resolve('dist/home.html'), 'utf8');
        assert.ok(html.includes(`assets/js/scripts.js?v=${buildIdMatch[1]}`), 'Error: BUILD_ID de JS y versionado HTML no coinciden.');
        console.log('✅ JS Production Config: Validado.');

        // 3. Integridad de Activos Críticos
        const logoPath = path.resolve('dist/assets/img/luxus.webp');
        assert.ok(existsSync(logoPath), 'Error: El activo de marca crítico (logo) no se copió al dist.');
        console.log('✅ Integridad de Activos: Validado.');

        console.log('\n🚀 Todas las pruebas de integridad pasaron. El despliegue es seguro.\n');
    } catch (err) {
        console.error('\n💥 Fallo en la prueba de integridad:', err.message);
        process.exit(1);
    }
}

runTests();
