import { promises as fs } from 'fs';
import path from 'path';
import { minify } from 'terser';

const JS_DIR = './dist/assets/js';

async function getJsFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) return getJsFiles(res);
        return entry.name.endsWith('.js') ? res : null;
    }));
    return files.flat().filter(Boolean);
}

async function minifyJsFiles() {
    console.log('⚡ Minificando archivos JavaScript recursivamente...');
    try {
        const jsFiles = await getJsFiles(JS_DIR);

        await Promise.all(jsFiles.map(async (filePath) => {
            const relativePath = path.relative(JS_DIR, filePath);
            const content = await fs.readFile(filePath, 'utf8');
            
            const result = await minify(content, {
                compress: {
                    passes: 3,
                    drop_console: true,
                    pure_getters: true,
                    unsafe: true,
                    unsafe_arrows: true,
                    unsafe_math: true,
                    hoist_funs: true,
                    dead_code: true
                },
                mangle: {
                    toplevel: false,
                    safari10: true
                },
                format: {
                    comments: false
                }
            });

            if (result.code) {
                await fs.writeFile(filePath, result.code);
                console.log(`✅ Minificado: ${relativePath}`);
            } else if (result.error) {
                // Mejora: lanzar error con contexto del archivo
                throw new Error(`${relativePath}: ${result.error.message}`);
            }
        }));

        console.log('✨ Minificación JavaScript finalizada.');
    } catch (err) {
        console.error('💥 Error fatal durante la minificación de JavaScript:', err);
        process.exit(1); // Salir con error si algo falla gravemente
    }
}

minifyJsFiles();