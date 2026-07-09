/**
 * @file Servicio de carga de fragmentos HTML.
 * Gestiona la carga, cacheo e inicialización de contenido parcial.
 */

import { getState, log } from '../core/state.js';
import { hydrateComponents } from '../core/component-registry.js';
import { initObservers } from '../utils/observers.js';

const activeRequests = new Map();

/**
 * Obtiene la clave de caché para un archivo de fragmento.
 * @param {string} file
 * @returns {string}
 */
function getCacheKey(file) {
    const { buildId } = getState();
    return `lux_cache_${buildId}_${file}`;
}

/**
 * Obtiene un fragmento desde sessionStorage si es válido.
 * @param {string} file
 * @returns {string|null}
 */
function getFromCache(file) {
    const { disableFragmentCache, isStaging } = getState();
    if (disableFragmentCache) return null;

    try {
        const cachedItem = sessionStorage.getItem(getCacheKey(file));
        if (!cachedItem) return null;

        const { html, timestamp } = JSON.parse(cachedItem);

        // En staging, la caché expira después de 1 segundo para facilitar el desarrollo.
        if (isStaging && (Date.now() - timestamp > 1000)) {
            log(`Caché para ${file} expirada en Staging.`, { scope: 'FragmentLoader' });
            return null;
        }

        return html;
    } catch (error) {
        log(error, { scope: 'FragmentLoaderCacheRead' });
        return null;
    }
}

/**
 * Guarda un fragmento en sessionStorage.
 * @param {string} file
 * @param {string} html
 */
function setInCache(file, html) {
    const { disableFragmentCache } = getState();
    if (disableFragmentCache) return;

    try {
        const item = JSON.stringify({ html, timestamp: Date.now() });
        sessionStorage.setItem(getCacheKey(file), item);
    } catch (error) {
        log(error, { scope: 'FragmentLoaderCacheWrite' });
    }
}

/**
 * Carga y renderiza un fragmento HTML en un elemento del DOM.
 * @param {string} placeholderId - ID del elemento placeholder.
 */
async function loadFragment(placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    const { fragments, buildId } = getState();
    const file = placeholder.dataset.fragment || fragments[placeholderId]?.file;

    if (!file) {
        log(`No se encontró configuración de archivo para el fragmento: ${placeholderId}`, { scope: 'FragmentLoader' });
        return;
    }

    try {
        let html = getFromCache(file);

        if (!html) {
            if (activeRequests.has(file)) {
                html = await activeRequests.get(file);
            } else {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8s

                const fetchPromise = fetch(`${file}?v=${buildId}`, { signal: controller.signal })
                    .then(async (res) => {
                        clearTimeout(timeoutId);
                        if (!res.ok) throw new Error(`Error al cargar fragmento: ${res.status} ${res.statusText}`);
                        const text = await res.text();
                        setInCache(file, text);
                        return text;
                    })
                    .finally(() => {
                        activeRequests.delete(file);
                    });

                activeRequests.set(file, fetchPromise);
                html = await fetchPromise;
            }
        }

        if (html) {
            const parent = placeholder.parentElement;
            placeholder.outerHTML = html;

            // Re-inicializar funcionalidades en el nuevo contenido
            if (parent) {
                initObservers(parent);
                hydrateComponents(parent);
            }
        }
    } catch (error) {
        log(error, { placeholderId, file, phase: 'loadFragment' });
        placeholder.innerHTML = `<div class="p-4 text-center border border-red-500/20 rounded-md bg-red-500/5"><p class="text-xs font-bold uppercase text-red-400">Error al cargar esta sección</p></div>`;
    }
}

/**
 * Carga todos los fragmentos marcados como críticos.
 */
export async function loadCriticalFragments() {
    const { fragments } = getState();
    const criticalTasks = [];

    for (const id in fragments) {
        if (fragments[id].load === 'critical' && document.getElementById(id)) {
            criticalTasks.push(loadFragment(id));
        }
    }
    await Promise.all(criticalTasks);
}

/**
 * Configura un IntersectionObserver para cargar fragmentos lazy.
 */
export function loadLazyFragments() {
    const lazyPlaceholders = document.querySelectorAll('[data-fragment-load="lazy"], [id$="-placeholder"]:not([data-fragment-load="critical"])');
    const lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadFragment(entry.target.id);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: window.innerWidth < 768 ? '300px' : '500px' });

    lazyPlaceholders.forEach(el => {
        if (getState().fragments[el.id]?.load !== 'critical') {
            lazyObserver.observe(el);
        }
    });
}