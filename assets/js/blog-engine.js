import { log } from './app/core/state.js';
import { sanityFetch, getSanityImageUrl, getSanityImageDimensions } from './app/services/sanity-client.js';
import { initObservers } from './app/utils/observers.js';

const BlogEngine = {
  TTL: 3600000,
  allPosts: [],
  activeCategory: "Todos",
  gridElement: null,
  filterContainer: null,

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

  escapeGroqString(value = "") {
    if (typeof value !== 'string') return '';
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  },

  getPostsProjection() {
    return `{
      title,
      publishedAt,
      mainImage,
      "slug": slug.current,
      "categories": coalesce(categories[]->title, []),
      excerpt
    }`;
  },

  async getLatestPosts(limit = null) {
    const range = Number.isInteger(limit) && limit > 0 ? ` [0...${limit}]` : "";
    const query = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)${range} ${this.getPostsProjection()}`;
    return sanityFetch(query, { useCache: true, ttl: this.TTL });
  },

  async getPostsByCategory(category) {
    if (!category || category === "Todos") return this.getLatestPosts();
    const query = `*[_type == "post" && "${this.escapeGroqString(category)}" in categories[]->title && defined(slug.current)] | order(publishedAt desc) ${this.getPostsProjection()}`;
    return sanityFetch(query, { useCache: true, ttl: this.TTL });
  },

  cleanCache() {
    const clean = () => {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (!key.startsWith("lux_sanity_")) return;
          try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (Date.now() > entry.expires) localStorage.removeItem(key);
          } catch (error) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        log(error, { scope: "BlogEngine_cleanCache" });
      }
    };

    "requestIdleCallback" in window ? window.requestIdleCallback(clean) : setTimeout(clean, 2000);
  },

  async init(containerElement) {
    this.gridElement = containerElement.querySelector("#blog-grid");
    this.filterContainer = containerElement.querySelector("#category-filters");

    if (!this.gridElement) return;

    try {
      this.allPosts = await this.getLatestPosts();
      if (!Array.isArray(this.allPosts)) throw Error("No se pudieron recuperar los articulos");

      this.renderFilters();
      this.renderGrid(this.allPosts);
      this.setupFilterListeners();
      this.cleanCache();
    } catch (error) {
      log(error, { scope: "BlogEngine_init" });
      this.gridElement.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500">Error al cargar el pensamiento estratégico.</div>';
    }
  },

  renderFilters() {
    if (!this.filterContainer) return;

    const categories = ["Todos", ...new Set(this.allPosts.flatMap((post) => post.categories || []))];
    this.filterContainer.innerHTML = categories.map((category) => {
      const safeCategory = this.escapeHtml(category);
      const activeClass = category === this.activeCategory ? "active" : "";
      return `
        <button type="button" data-category="${safeCategory}" class="btn-filter ${activeClass}">
          ${safeCategory}
        </button>
      `;
    }).join("");
  },

  setupFilterListeners() {
    this.filterContainer?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;

      document.querySelectorAll(".btn-filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      const category = button.dataset.category;
      this.activeCategory = category;
      const posts = category === "Todos"
        ? this.allPosts
        : this.allPosts.filter((post) => post.categories?.includes(category));
      this.renderGrid(posts);
    });
  },

  renderGrid(posts) {
    if (!this.gridElement) return;

    if (!Array.isArray(posts) || posts.length === 0) {
      this.gridElement.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500">No hay artículos en esta categoría.</div>';
      return;
    }

    this.gridElement.innerHTML = posts.map((post, index) => {
      const isFeature = index === 0;
      const isWide = index === 3;
      const cardClass = isFeature ? "blog-card-feature lg:col-span-2 lg:row-span-2" : isWide ? "blog-card-wide lg:col-span-2" : "";
      const imageWidth = isFeature || isWide ? 1200 : 800;
      const imageUrl = post.mainImage ? getSanityImageUrl(post.mainImage, imageWidth) : "";
      const dimensions = getSanityImageDimensions?.(post.mainImage);
      const published = post.publishedAt
        ? new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(post.publishedAt))
        : "Luxus";
      const slug = encodeURIComponent(post.slug || "");
      const title = this.escapeHtml(post.title || "Artículo Luxus");
      const datetime = this.escapeHtml(post.publishedAt || "");
      const alt = this.escapeHtml(post.mainImage?.alt || post.title || "Artículo Luxus");
      const category = this.escapeHtml(post.categories?.[0] || "Análisis");
      const excerpt = this.escapeHtml(post.excerpt || "Lectura de comunicación estratégica para organizaciones que necesitan decidir con criterio.");
      const imageAttrs = dimensions ? ` width="${dimensions.width}" height="${dimensions.height}"` : "";

      return `
        <article class="luxus-card blog-card group reveal ${cardClass}">
          <div class="blog-card-media">
            ${imageUrl ? `<img src="${imageUrl}" alt="${alt}" loading="${index < 2 ? "eager" : "lazy"}" decoding="async"${imageAttrs}>` : ""}
          </div>
          <div class="blog-card-content">
            <div class="blog-card-meta">
              <span>${category}</span>
              <time datetime="${datetime}">${published}</time>
            </div>
            <h3 class="${isFeature ? "text-2xl md:text-1xl" : "text-xl"} font-bold text-white text-balance">${title}</h3>
            <p>${excerpt}</p>
            <a href="post.html?id=${slug}" class="blog-card-cta mt-6" aria-label="Leer ${title}">
              <span>Leer análisis</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </a>
          </div>
        </article>
      `;
    }).join("");

    initObservers(this.gridElement);
  },
};

export function init(containerElement) {
  BlogEngine.init(containerElement);
}
