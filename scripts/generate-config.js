/**
 * @file Genera el archivo de configuración de la aplicación a partir de variables de entorno.
 * Este script se ejecuta en el paso de pre-build para inyectar la configuración
 * específica del entorno (desarrollo, producción) en la aplicación.
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env si existe (para desarrollo local)
require('dotenv').config();

const config = {
    contactEmail: process.env.LUXUS_CONTACT_EMAIL_B64 || 'aW5mb0BsdXh1c2NvbnN1bHRvcmVzLmNvbQ==',
    formId: process.env.LUXUS_FORMSPREE_ID || 'mojbejqq',
    gaId: process.env.LUXUS_GA_ID || 'G-J6RXLNGEQV',
    sanity: {
        projectId: process.env.LUXUS_SANITY_PROJECT_ID || '0otvx84b',
        dataset: process.env.LUXUS_SANITY_DATASET || 'production',
        apiVersion: '2023-01-01',
    },
    fragments: {
        'breadcrumb-placeholder': { file: '', load: 'internal' },
        'navigation-placeholder': { file: 'assets/partials/navigation-section.html', load: 'critical' },
        'cta-placeholder': { file: 'assets/partials/cta-home.html', load: 'critical' },
        'footer-placeholder': { file: 'assets/partials/footer-section.html', load: 'critical' },
        'contact-placeholder': { file: 'assets/partials/form-section.html', load: 'lazy' },
        'faq-placeholder': { file: 'assets/partials/faq-section.html', load: 'lazy' },
        'metodologia-placeholder': { file: 'assets/partials/metodologia-section.html', load: 'lazy' },
        'cards-services-placeholder': { file: 'assets/partials/cards-services-section.html', load: 'lazy' },
    },
};

const configContent = `
/**
 * @file Archivo de configuración autogenerado. ¡NO EDITAR MANUALMENTE!
 * Este archivo es generado por 'scripts/generate-config.js' durante el proceso de build.
 */
export const config = ${JSON.stringify(config, null, 4)};
`;

const outputPath = path.resolve(__dirname, '../src/js/core/config.js');

// Asegurarse de que el directorio de salida exista
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, configContent.trim());

console.log(`✅ Archivo de configuración generado en: ${outputPath}`);