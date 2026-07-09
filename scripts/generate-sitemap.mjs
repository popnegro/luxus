import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import fs from 'fs';

/**
 * Automatización de Sitemap para Luxus Consultores
 * Integra páginas estáticas y posts dinámicos de Sanity.io
 */

const BASE_URL = 'https://www.luxusconsultores.com';
const SANITY_CONFIG = {
    projectId: '0otvx84b',
    dataset: 'production',
    apiVersion: '2023-01-01'
};

const staticPages = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/index.html', changefreq: 'weekly', priority: 1.0 },
    { url: '/home.html', changefreq: 'weekly', priority: 1.0 },
    { 
        url: '/servicios.html', 
        changefreq: 'weekly', 
        priority: 0.9,
        img: [{
            url: `${BASE_URL}/assets/img/luxus-consultores.webp`,
            title: 'Expertise y Soluciones Luxus',
            caption: 'Consultoría estratégica en comunicación y reputación.'
        }]
    },
    { url: '/nosotros.html', changefreq: 'weekly', priority: 0.8 },
    { url: '/blog.html', changefreq: 'weekly', priority: 0.8 }
];

async function getBlogPosts() {
    // Actualizamos la query para traer el título y la URL de la imagen principal
    const query = encodeURIComponent('*[_type == "post" && defined(slug.current)]{ "slug": slug.current, _updatedAt, title, "imageUrl": mainImage.asset->url }');
    const url = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;
    
    try {
        const res = await fetch(url);
        const json = await res.json();
        
        if (!json.result) return [];
        
        return json.result.map(post => ({
            url: `/post.html?id=${post.slug}`,
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: post._updatedAt,
            // Añadimos metadatos de imagen para Google Imágenes
            img: post.imageUrl ? [{
                url: post.imageUrl,
                title: post.title,
                caption: `Imagen destacada de: ${post.title}`
            }] : []
        }));
    } catch (e) {
        console.error('❌ Error obteniendo posts de Sanity para el sitemap:', e.message);
        return [];
    }
}

async function generate() {
    console.log('🌐 Generando sitemap.xml actualizado...');
    
    const dynamicPages = await getBlogPosts();
    const links = [...staticPages, ...dynamicPages];
    
    const stream = new SitemapStream({ hostname: BASE_URL });
    const data = await streamToPromise(Readable.from(links).pipe(stream));
    
    fs.writeFileSync('./sitemap.xml', data.toString());
    console.log(`✅ sitemap.xml generado con ${links.length} rutas.`);
}

generate().catch(console.error);
