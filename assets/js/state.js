/**
 * @file Módulo de gestión de estado y configuración global.
 * Importa la configuración estática y gestiona el estado dinámico de la aplicación.
 * Actúa como la única fuente de verdad (Single Source of Truth) para la configuración de la aplicación.
 */

/**
 * @typedef {object} SanityConfig
 * @property {string} projectId
 * @property {string} dataset
 * @property {string} apiVersion
 */

/**
 * @typedef {object} FragmentConfig
 * @property {string} file - Ruta al archivo HTML del fragmento.
 * @property {'critical' | 'lazy' | 'internal'} load - Estrategia de carga.
 */

/**
 * @typedef {object} LuxusState
 * @property {string} buildId - Identificador único de la compilación.
 * @property {string} contactEmail - Email de contacto (codificado en base64).
 * @property {string} formId - ID del formulario de Formspree.
 * @property {string} gaId - ID de Google Analytics.
 * @property {boolean} isStaging - Indica si el entorno es de desarrollo/staging.
 * @property {SanityConfig} sanity - Configuración del cliente de Sanity.
 * @property {Object<string, FragmentConfig>} fragments - Registro de fragmentos y sus rutas.
 * @property {boolean} disableFragmentCache - Deshabilita la caché de fragmentos en sessionStorage.
 * @property {Set<string>} loadedScripts - Registro de URLs de scripts externos ya cargados.
 */

let state = {};

/**
 * Inicializa el estado global de la aplicación.
 * @param {string} buildId - El ID de la build actual.
 */
export function initState(buildId) {
    const isStaging = import.meta.env.VITE_IS_STAGING === 'true';

    state = {
        buildId,
        contactEmail: 'aW5mb0BsdXh1c2NvbnN1bHRvcmVzLmNvbQ==',
        formId: import.meta.env.VITE_FORMSPREE_ID || 'mojbejqq',
        gaId: import.meta.env.VITE_GA_ID || 'G-J6RXLNGEQV',
        isStaging,
        disableFragmentCache: isStaging || import.meta.env.DEV,
        sanity: {
            projectId: '0otvx84b',
            dataset: 'production',
            apiVersion: '2023-01-01'
        },
        fragments: {
            'breadcrumb-placeholder': { file: '', load: 'internal' },
            'navigation-placeholder': { file: 'assets/partials/navigation-section.html', load: 'critical' },
            'footer-placeholder': { file: 'assets/partials/footer-section.html', load: 'critical' },
            'contact-placeholder': { file: 'assets/partials/form-section.html', load: 'lazy' },
            'faq-placeholder': { file: 'assets/partials/faq-section.html', load: 'lazy' },
        },
        loadedScripts: new Set(),
    };
    Object.freeze(state); // Congelar el estado para hacerlo inmutable
}

/**
 * Devuelve una copia inmutable del estado actual.
 * @returns {LuxusState}
 */
export const getState = () => state;

/**
 * Centraliza el registro de errores para futuro seguimiento.
 * @param {Error|string} error - El error o mensaje a registrar.
 * @param {object} [context={}] - Contexto adicional sobre el error.
 */
export function log(error, context = {}) {
    const message = error instanceof Error ? error.message : String(error);
    if (state.isStaging) {
        console.error(`[Luxus Log] ${message}`, { error, context });
    } else {
        // Aquí se integraría un servicio como Sentry, LogRocket, etc.
        // Ejemplo: Sentry.captureException(error, { extra: context });
        console.warn(`[Error Capturado] ${message}`, context);
    }
}