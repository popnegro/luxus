import { getState, log } from './app/core/state.js';
import { sanityFetch, getSanityImageUrl, getSanityImageDimensions } from './app/services/sanity-client.js';
import { initPageSEO } from './app/utils/seo.js';

const PostLoader = {
    TTL: 3600000, // 1 hora

    escapeHtml(value = "") {
        if (typeof value !== 'string') return '';
        return value.replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[char]);
    },

    getPostQuery() {
        return `*[_type == "post" && slug.current == $slug][0]{
            title,
            publishedAt,
            mainImage,
            "slug": slug.current,
            "categories": coalesce(categories[]->title, []),
            body,
            excerpt,
            "related": *[_type == "post" && count(categories[@._ref in ^.^.categories[]._ref]) > 0 && _id != ^._id] | order(publishedAt desc) [0...3] {
                title,
                "slug": slug.current,
                mainImage,
                "category": categories[0]->title
            }
        }`;
    },

    async fetchPost(slug) {
        if (!slug) {
            throw new Error("No se proporcionó un slug de artículo.");
        }
        const query = this.getPostQuery();
        const params = { slug };
        return sanityFetch(query, { useCache: true, ttl: this.TTL, params });
    },

    renderPost(post) {
        document.getElementById('post-title').textContent = post.title || 'Artículo sin título';
        
        const postDate = document.getElementById('post-date');
        if (post.publishedAt) {
            postDate.textContent = new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(post.publishedAt));
            postDate.setAttribute('datetime', post.publishedAt);
        }

        const postCategory = document.getElementById('post-category');
        if (post.categories?.[0]) {
            postCategory.textContent = post.categories[0];
            postCategory.classList.remove('hidden');
        }

        const postImage = document.getElementById('post-image');
        if (post.mainImage) {
            const imageUrl = getSanityImageUrl(post.mainImage, 1200);
            const dimensions = getSanityImageDimensions(post.mainImage);
            postImage.src = imageUrl;
            postImage.alt = post.mainImage.alt || post.title;
            if (dimensions) {
                postImage.width = dimensions.width;
                postImage.height = dimensions.height;
            }
            postImage.closest('.skeleton')?.classList.remove('skeleton');
        } else {
            postImage.parentElement.style.display = 'none';
        }

        const contentEl = document.getElementById('post-content');
        contentEl.innerHTML = ''; // Limpiar skeletons
        // Aquí se procesaría el `body` (Portable Text) a HTML.
        // Por ahora, como ejemplo, mostramos un texto si el body está vacío.
        if (post.body && Array.isArray(post.body)) {
             // Implementación simple para renderizar bloques de texto
            post.body.forEach(block => {
                if (block._type === 'block' && block.style === 'normal' && block.children) {
                    const p = document.createElement('p');
                    p.textContent = block.children.map(span => span.text).join('');
                    contentEl.appendChild(p);
                }
            });
        } else {
            contentEl.innerHTML = '<p>Contenido no disponible.</p>';
        }

        initPageSEO({
            title: `${post.title} | Luxus Consultores`,
            description: post.excerpt,
            imageUrl: getSanityImageUrl(post.mainImage, 1200),
            url: window.location.href,
            type: 'article'
        });

        this.setupShareLinks(post);
        this.renderRelatedPosts(post.related);
    },

    renderRelatedPosts(related) {
        const container = document.getElementById('related-posts-grid');
        const section = document.getElementById('related-posts-section');
        if (!container || !related || related.length === 0) {
            section?.classList.add('hidden');
            return;
        }

        container.innerHTML = related.map(post => {
            const imageUrl = getSanityImageUrl(post.mainImage, 400);
            const slug = encodeURIComponent(post.slug || "");
            const title = this.escapeHtml(post.title);
            const category = this.escapeHtml(post.category || "Análisis");

            return `
                <a href="post.html?id=${slug}" class="related-post-card group">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" loading="lazy" decoding="async">` : ''}
                    <div class="related-post-content">
                        <span class="related-post-category">${category}</span>
                        <h3 class="related-post-title">${title}</h3>
                    </div>
                </a>
            `;
        }).join('');
        section.classList.remove('hidden');
    },

    setupShareLinks(post) {
        const url = window.location.href;
        const title = encodeURIComponent(post.title);
        document.getElementById('share-linkedin').href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
        document.getElementById('share-x').href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    },

    async init() {
        const slug = new URLSearchParams(window.location.search).get('id');
        if (!slug) {
            document.getElementById('main-content').innerHTML = '<div class="section-container text-center py-20"><h1 class="hero-title">Artículo no encontrado</h1><p class="section-description">No se especificó un ID de artículo válido.</p></div>';
            return;
        }

        try {
            const post = await this.fetchPost(slug);
            if (!post) throw new Error(`El artículo con slug "${slug}" no fue encontrado.`);
            this.renderPost(post);
        } catch (error) {
            log(error, { scope: 'PostLoader_init' });
            document.getElementById('main-content').innerHTML = `<div class="section-container text-center py-20"><h1 class="hero-title">Error al cargar el artículo</h1><p class="section-description">${error.message}</p></div>`;
        }
    }
};

export function init() {
    PostLoader.init();
}