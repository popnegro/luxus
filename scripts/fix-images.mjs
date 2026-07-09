import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const DIST_DIR = './dist';

async function getFiles(dir) {
    const subdirs = await fs.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

async function autoFixImages() {
    console.log('🔧 Iniciando post-procesamiento de Activos y Estilos...');
    const allFiles = await getFiles(DIST_DIR);
    const filesToProcess = allFiles.filter(f => f.endsWith('.html') || f.endsWith('.css'));

    for (const file of filesToProcess) {
        let content = await fs.readFile(file, 'utf8');
        let modified = false;

        if (file.endsWith('.html')) {
            const imgRegex = /<img\s+([^>]+)>/gi;
        const matches = [...content.matchAll(imgRegex)];

        for (const match of matches) {
            const fullTag = match[0];
            const attributes = match[1];

            const srcMatch = attributes.match(/src=["']([^"']+)["']/);
            if (!srcMatch || !srcMatch[1]) continue;

            const src = srcMatch[1];
            // Resolver ruta de la imagen en dist
            const imgPath = path.join(DIST_DIR, src.startsWith('/') ? src.slice(1) : src);

            try {
                let updatedAttributes = attributes;
                const ext = path.extname(src);
                const isStandardImg = ['.jpg', '.jpeg', '.png'].includes(ext.toLowerCase());
                
                // Si es una imagen estándar, intentamos ver si tiene una versión .webp optimizada
                if (isStandardImg) {
                    const webpSrc = src.replace(ext, '.webp');
                    const webpPath = path.join(DIST_DIR, webpSrc.startsWith('/') ? webpSrc.slice(1) : webpSrc);
                    try {
                        await fs.access(webpPath);
                        // Actualizamos el src en los atributos para el HTML final
                        updatedAttributes = updatedAttributes.replace(src, webpSrc);
                    } catch (e) { /* No hay .webp, mantenemos original */ }
                }

                await fs.access(imgPath);
                const metadata = await sharp(imgPath).metadata();

                // 1. Inyectar Dimensiones (Previene CLS)
                if (!attributes.includes('width=')) {
                    updatedAttributes += ` width="${metadata.width}"`;
                }
                if (!attributes.includes('height=')) {
                    updatedAttributes += ` height="${metadata.height}"`;
                }

                // 2. SEO: Alt y Title automáticos (basados en el nombre del archivo)
                const fileName = path.basename(src, path.extname(src)).replace(/[-_]/g, ' ');
                const friendlyName = fileName.charAt(0).toUpperCase() + fileName.slice(1);

                if (!attributes.includes('alt=')) {
                    updatedAttributes += ` alt="${friendlyName}"`;
                }
                if (!attributes.includes('title=')) {
                    updatedAttributes += ` title="${friendlyName}"`;
                }

                // 3. Performance: Loading Lazy (Excepto para el logo o imágenes marcadas como eager)
                const isCritical = attributes.includes('id="main-logo"') || 
                                 attributes.includes('hero') || 
                                 src.includes('luxus.webp') ||
                                 attributes.includes('fetchpriority="high"');
                                 
                if (isCritical) {
                    updatedAttributes = updatedAttributes.replace(/loading=["']lazy["']/g, '');
                    if (!updatedAttributes.includes('loading=')) updatedAttributes += ` loading="eager"`;
                    if (!updatedAttributes.includes('fetchpriority=')) updatedAttributes += ` fetchpriority="high"`;
                } else if (!attributes.includes('loading=')) {
                    updatedAttributes += ` loading="lazy"`;
                }

                const newTag = `<img ${updatedAttributes.trim().replace(/\s\s+/g, ' ')}>`;
                content = content.replace(fullTag, newTag);
                modified = true;
            } catch (e) {
                // Ignorar imágenes externas o que no existen
            }
        }
        } else if (file.endsWith('.css')) {
            // Procesar url() en archivos CSS
            const cssUrlRegex = /url\(['"]?([^'")]+?\.(?:jpg|jpeg|png))['"]?\)/gi;
            const matches = [...content.matchAll(cssUrlRegex)];

            for (const match of matches) {
                const fullMatch = match[0];
                const src = match[1];
                const ext = path.extname(src);
                const webpSrc = src.replace(ext, '.webp');
                
                // Resolver la ruta de la imagen relativa al archivo CSS
                const absolutePathToWebp = path.resolve(path.dirname(file), webpSrc);

                try {
                    await fs.access(absolutePathToWebp);
                    content = content.replace(fullMatch, fullMatch.replace(src, webpSrc));
                    modified = true;
                } catch (e) {
                    // Si no hay .webp, dejamos el original (se mantendrá el 404 o el original si no se borró)
                }
            }
        }

        if (modified) {
            await fs.writeFile(file, content);
            console.log(`✅ Procesado: ${path.relative(DIST_DIR, file)}`);
        }
    }
    console.log('✨ Proceso de inyección finalizado.');
}

autoFixImages();