import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const htmlFiles = globSync('./*.html').map((file) => file.replace('./', ''));

test.describe('Luxus static pages', () => {
    for (const fileName of htmlFiles) {
        test(`${fileName} loads fragments and semantic shell`, async ({ page }) => {
            const html = readFileSync(fileName, 'utf8');
            const placeholders = [...html.matchAll(/id=["']([^"']+-placeholder)["']/g)].map((match) => match[1]);

            await page.goto(`/${fileName}`);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 160;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 40);
                });
            });
            await page.waitForTimeout(500);

            for (const id of placeholders) {
                await expect(page.locator(`#${id}`)).toHaveCount(0);
            }

            await expect(page.locator('main')).toHaveCount(1);
            await expect(page.locator('h1:visible')).toHaveCount(1);
        });
    }
});
