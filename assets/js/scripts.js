import { initState, getState, log } from './app/core/state.js';
import { registerComponent, hydrateComponents } from './app/core/component-registry.js';
import { preconnectToSanity } from './app/services/sanity-client.js';
import { initAnalytics } from './app/services/analytics.js';
import { init as initNavigation } from './app/components/navigation.js';
import { init as initServiceTabs } from './app/components/tabs.js';
import { init as initFAQAccordion } from './app/components/accordion.js';
import { init as initTheme } from './app/utils/theme.js';
import { initObservers } from './app/utils/observers.js';
import { initScrollManager } from './app/utils/events.js';
import { initBusinessSchema, initFAQSchema, initPageSEO } from './app/utils/seo.js';
import { initSmoothScroll, initEmailClipboard, initActiveSubnav, initSpotlight, syncEmail } from './app/utils/dom.js';
import { init as initCta } from './app/utils/cta.js';
import { init as initCarousels } from './app/components/carousel.js';
import { showStatus, closeStatus } from './app/components/status-toast.js';
import { init as initBlog } from './blog-engine.js';
import { init as initPost } from './post-loader.js';
import { initializeFormHandler } from './form-handler.js';

/**
 * Identificador único de build.
 * Este valor es inyectado por el proceso de despliegue (deploy.sh) para cache-busting.
 * @type {string}
 */
const BUILD_ID = '1779945139';

/**
 * @typedef {import('./app/core/state.js').LuxusState} LuxusState
 */

/**
 * Limpia cachés de versiones anteriores almacenadas en sessionStorage.
 * @param {string} currentBuildId
 */
function cleanupOldCache(currentBuildId) {
    if (!currentBuildId) return;
    try {
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('lux_cache_') && !key.includes(`_${currentBuildId}_`)) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (e) {
        log(e, { scope: 'sessionStorage_cleanup' });
    }
}

/**
 * Registra los componentes de la aplicación para que puedan ser hidratados dinámicamente.
 */
function registerAllComponents() {
    registerComponent('navigation', initNavigation);
    registerComponent('faq', initFAQAccordion);
    registerComponent('cta', initCta);
    registerComponent('service-tabs', initServiceTabs);
    registerComponent('carousels', initCarousels);
    registerComponent('form', () => initializeFormHandler());
    registerComponent('blog', initBlog);
    registerComponent('post', initPost);
}

/**
 * Orquesta la secuencia de inicialización principal de la aplicación.
 */
async function main() {
    // 1. Inicializar el estado global de la aplicación.
    initState(BUILD_ID);
    const { isStaging } = getState();

    // 2. Registrar todos los componentes dinámicos.
    registerAllComponents();

    // 3. Realizar tareas de limpieza y optimización inicial.
    cleanupOldCache(BUILD_ID);
    preconnectToSanity();

    // 4. Hidratar componentes presentes en el DOM.
    hydrateComponents(document.body);

    // 5. Inicializar funcionalidades principales.
    initTheme();
    initObservers(document.body);
    initScrollManager();
    initSmoothScroll();
    initEmailClipboard();
    initActiveSubnav();
    initSpotlight();
    syncEmail();

    // Listener universal para botones de cierre de notificaciones
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-dismiss-toast]');
        if (closeBtn) {
            closeStatus(closeBtn.closest('[role="status"]'));
        }
    });

    // 6. Inicializar SEO y datos estructurados.
    initBusinessSchema();
    initPageSEO();
    initFAQSchema();

    // 7. Iniciar analíticas de forma diferida para no impactar el TTI.
    'requestIdleCallback' in window
        ? requestIdleCallback(initAnalytics)
        : setTimeout(initAnalytics, 500);

    if (isStaging) {
        console.log(`[Luxus] App inicializada. Modo Staging Activado.`);
        // Exponer funciones de utilidad para depuración en staging
        window.luxus = {
            ...window.luxus,
            showStatus,
            getState
        };
    }
}

// Iniciar la aplicación una vez que el DOM esté listo.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
