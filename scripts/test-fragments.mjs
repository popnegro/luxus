import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const BASE_URL = 'http://localhost:3000';
const HTML_FILES = globSync('./*.html');

async function testPlaceholders() {
    console.log('🚀 Iniciando auditoría de carga de fragmentos...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    let totalErrors = 0;

    for (const file of HTML_FILES) {
        const page = await context.newPage();
        const fileName = file.replace('./', '');
        const url = `${BASE_URL}/${fileName}`;

        const content = readFileSync(file, 'utf8');
        const placeholderRegex = /id="([\w-]+-placeholder)"/g;
        const expectedPlaceholders = [];
        let match;
        while ((match = placeholderRegex.exec(content)) !== null) {
            expectedPlaceholders.push(match[1]);
        }

        if (expectedPlaceholders.length === 0) {
            await page.close();
            continue;
        }

        console.log(`\n📄 Analizando: ${fileName} (${expectedPlaceholders.length} fragmentos)`);

        try {
            await page.goto(url);
            
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 50);
                });
            });

            await page.waitForTimeout(1000);

            for (const id of expectedPlaceholders) {
                const exists = await page.$(`#${id}`);
                if (exists) {
                    console.error(`  ❌ ERROR: El placeholder [#${id}] no se cargó.`);
                    totalErrors++;
                } else {
                    console.log(`  ✅ [#${id}] cargado correctamente.`);
                }
            }
        } catch (err) {
            console.error(`  ⚠️ No se pudo cargar la página ${url}: ${err.message}`);
        } finally {
            await page.close();
        }
    }
    await browser.close();
    if (totalErrors > 0) process.exit(1);
}
testPlaceholders();