import { promises as fs } from 'fs';
import path from 'path';

const DIST_DIR = './dist';

async function getFiles(dir, ext) {
    const subdirs = await fs.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await fs.stat(res)).isDirectory() ? getFiles(res, ext) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []).filter(f => f.endsWith(ext));
}

async function checkCssAssets() {
    console.log('🔍 Verificando integridad de activos en archivos CSS...');
    const cssFiles = await getFiles(DIST_DIR, '.css');
    let totalErrors = 0;

    for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf8');
        // Regex para capturar url() - Maneja comillas opcionales
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
        let match;

        while ((match = urlRegex.exec(content)) !== null) {
            let assetUrl = match[1];

            // Ignorar URLs externas o datos en base64
            if (assetUrl.startsWith('http') || assetUrl.startsWith('https') || assetUrl.startsWith('data:') || assetUrl.startsWith('//') || assetUrl.startsWith('#') || assetUrl.startsWith('%23')) {
                continue;
            }

            // Limpiar query strings o hashes (ej: font.woff2?v=1.2)
            const cleanAssetUrl = assetUrl.split('?')[0].split('#')[0];

            // Resolver la ruta absoluta del activo relativa al archivo CSS
            const assetPath = path.resolve(path.dirname(file), cleanAssetUrl);

            try {
                await fs.access(assetPath);
            } catch (err) {
                console.error(`❌ Activo no encontrado: "${assetUrl}"`);
                console.error(`   Referenciado en: ${path.relative(process.cwd(), file)}`);
                console.error(`   Ruta intentada: ${path.relative(process.cwd(), assetPath)}`);
                totalErrors++;
            }
        }
    }

    if (totalErrors > 0) {
        console.error(`\n💥 Error de integridad: Se encontraron ${totalErrors} activos rotos en el CSS.`);
        process.exit(1);
    } else {
        console.log('✨ Todos los activos del CSS están presentes.\n');
    }
}

checkCssAssets().catch(err => {
    console.error('Error durante la verificación:', err);
    process.exit(1);
});