/**
 * @file Registro y sistema de hidratación para componentes dinámicos.
 * Permite que los fragmentos cargados dinámicamente inicialicen su propio JS.
 */

import { log } from './state.js';

/** @type {Map<string, (element: HTMLElement) => void>} */
const componentRegistry = new Map();

/**
 * Registra una función de inicialización para un componente.
 * @param {string} name - El nombre del componente (usado en `data-component`).
 * @param {(element: HTMLElement) => void} initFunction - La función que inicializa el componente.
 */
export function registerComponent(name, initFunction) {
    if (componentRegistry.has(name)) {
        log(`El componente "${name}" ya ha sido registrado.`, { scope: 'ComponentRegistry' });
    }
    componentRegistry.set(name, initFunction);
}

/**
 * Busca e inicializa todos los componentes registrados dentro de un elemento raíz.
 * @param {HTMLElement | Document} root - El elemento a escanear en busca de componentes.
 */
export function hydrateComponents(root = document) {
    root.querySelectorAll('[data-component]').forEach(element => {
        const componentNames = element.dataset.component.split(' ');
        componentNames.forEach(name => {
            const init = componentRegistry.get(name);
            if (init && !element.dataset.hydrated?.includes(name)) {
                try {
                    init(element);
                    element.dataset.hydrated = `${element.dataset.hydrated || ''} ${name}`;
                } catch (e) {
                    log(e, { component: name, phase: 'hydration' });
                }
            }
        });
    });
}