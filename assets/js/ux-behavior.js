(() => {
    const TAB_SELECTOR = '#serviceTabs .service-tab-btn';
    const PANEL_SELECTOR = '.tab-pane';
    const FAQ_SELECTOR = '.faq-item';

    const enhanceTabs = (root = document) => {
        const tablist = root.querySelector?.('#serviceTabs');
        if (!tablist || tablist.dataset.uxBehaviorEnhanced === 'true') return;

        const tabs = Array.from(tablist.querySelectorAll(TAB_SELECTOR));
        if (!tabs.length) return;

        tablist.setAttribute('role', 'tablist');
        tabs.forEach((tab, index) => {
            const panelId = tab.dataset.targetTab;
            const panel = panelId ? document.getElementById(panelId) : null;
            if (!panel) return;

            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panel.id);
            tab.setAttribute('tabindex', tab.getAttribute('aria-selected') === 'true' ? '0' : '-1');
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', tab.id);
            panel.setAttribute('tabindex', '0');
            panel.hidden = tab.getAttribute('aria-selected') !== 'true';
            tab.dataset.uxTabIndex = String(index);
        });

        tabs.forEach((tab) => {
            tab.addEventListener('keydown', (event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

                event.preventDefault();
                const currentIndex = tabs.indexOf(tab);
                let nextIndex = currentIndex;

                if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
                if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = tabs.length - 1;

                const nextTab = tabs[nextIndex];
                nextTab.click();
                tabs.forEach((item) => item.setAttribute('tabindex', item === nextTab ? '0' : '-1'));
                nextTab.focus({ preventScroll: true });
            });
        });

        const syncPanels = () => {
            tabs.forEach((tab) => {
                const panel = document.getElementById(tab.dataset.targetTab || '');
                const active = tab.getAttribute('aria-selected') === 'true';
                tab.setAttribute('tabindex', active ? '0' : '-1');
                if (panel) panel.hidden = !active;
            });
        };

        new MutationObserver(syncPanels).observe(tablist, {
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-selected']
        });

        syncPanels();
        tablist.dataset.uxBehaviorEnhanced = 'true';
    };

    const enhanceFaq = (root = document) => {
        root.querySelectorAll?.(FAQ_SELECTOR).forEach((item, index) => {
            const trigger = item.querySelector('.faq-trigger');
            const content = item.querySelector('.faq-content');
            if (!trigger || !content || trigger.dataset.uxBehaviorEnhanced === 'true') return;

            if (!content.id) content.id = `faq-answer-${index + 1}`;
            trigger.setAttribute('aria-controls', content.id);
            trigger.dataset.uxBehaviorEnhanced = 'true';
        });
    };

    const enhance = () => {
        enhanceTabs();
        enhanceFaq();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhance, { once: true });
    } else {
        enhance();
    }

    new MutationObserver(enhance).observe(document.body, {
        childList: true,
        subtree: true
    });
})();
