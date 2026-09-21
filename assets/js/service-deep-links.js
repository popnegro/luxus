(() => {
    const SERVICE_HASHES = {
        'comunicacion-institucional': 'tab-institucional',
        'relaciones-con-medios': 'tab-medios',
        'posicionamiento-estrategico': 'tab-posicionamiento',
        'gestion-de-reputacion': 'tab-reputacion',
        'comunicacion-de-crisis': 'tab-crisis',
        'asuntos-publicos': 'tab-asuntos',
        'estrategia-de-contenidos': 'tab-contenidos',
        'monitoreo-y-analisis': 'tab-monitoreo'
    };

    const activateFromHash = () => {
        if (!window.location.pathname.endsWith('/servicios.html')) return;
        const semanticHash = window.location.hash.slice(1);
        const targetId = SERVICE_HASHES[semanticHash];
        if (!targetId) return;

        const target = document.getElementById(targetId);
        const tab = document.querySelector(`[data-target-tab="${targetId}"]`);
        if (!target || !tab) return;

        if (tab.getAttribute('aria-selected') !== 'true') tab.click();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', activateFromHash, { once: true });
    } else {
        activateFromHash();
    }

    window.addEventListener('hashchange', activateFromHash);
})();
