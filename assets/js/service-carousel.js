(() => {
    const initHorizontalDrag = (selector) => {
        document.querySelectorAll(selector).forEach((container) => {
            if (container.dataset.horizontalDragInitialized === 'true') return;
            container.dataset.horizontalDragInitialized = 'true';

            let startX = 0;
            let startScrollLeft = 0;
            let dragging = false;

            container.addEventListener(
                'pointerdown',
                (event) => {
                    if (event.pointerType === 'mouse') return;
                    startX = event.clientX;
                    startScrollLeft = container.scrollLeft;
                    dragging = true;
                },
                { passive: true }
            );

            container.addEventListener(
                'pointermove',
                (event) => {
                    if (!dragging || event.pointerType === 'mouse') return;
                    const delta = event.clientX - startX;
                    if (Math.abs(delta) > 4) container.scrollLeft = startScrollLeft - delta;
                },
                { passive: true }
            );

            ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
                container.addEventListener(type, () => {
                    dragging = false;
                }, { passive: true });
            });
        });
    };

    initHorizontalDrag(
        '#services-carousel-container, #serviceTabs, .methodology-snap-carousel, #servicesCarousel'
    );

    const dots = document.querySelectorAll('#services-dots > button');
    const cards = document.querySelectorAll('#services-carousel-container > article');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            cards[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            dots.forEach((item, itemIndex) =>
                item.classList.toggle('active-dot', itemIndex === index)
            );
        });
    });
})();
