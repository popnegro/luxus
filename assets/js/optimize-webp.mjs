import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to the project root
const PROJECT_ROOT = path.resolve(__dirname, '..');
const INPUT_DIR = path.join(PROJECT_ROOT, 'assets/img');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist/assets/img');

async function convertToWebp() {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Find all JPG, JPEG, and PNG files in the assets folder
        const files = await glob(`${INPUT_DIR}/**/*.{jpg,jpeg,png}`);

        if (files.length === 0) {
            console.log('No images found to process in assets/img/');
            return;
        }

        console.log(`🚀 Optimizing ${files.length} images to WebP in /dist...`);

        const tasks = files.map(async (file) => {
            const relativePath = path.relative(INPUT_DIR, file);
            const output = path.join(OUTPUT_DIR, relativePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
            
            await fs.mkdir(path.dirname(output), { recursive: true });

            return sharp(file)
                .webp({ quality: 80, effort: 6 })
                .toFile(output)
                .then(() => console.log(`  ✅ Processed: ${relativePath}`));
        });

        await Promise.all(tasks);
        console.log('\n✨ Image optimization complete.');
    } catch (error) {
        console.error('❌ Error during optimization:', error);
        process.exit(1);
    }
}

convertToWebp();