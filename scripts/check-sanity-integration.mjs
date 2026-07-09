import fs from 'node:fs/promises'

const ROOT_CONFIG = {
  projectId: '0otvx84b',
  dataset: 'production',
  apiVersion: '2023-01-01',
}

const checks = []
const warnings = []

const read = (file) => fs.readFile(file, 'utf8')

const assertIncludes = (content, needle, label) => {
  if (!content.includes(needle)) {
    throw new Error(`${label}: falta "${needle}"`)
  }
  checks.push(label)
}

try {
  const [studioConfig, studioCli, postSchema, scripts, blogEngine, postLoader, sitemap] =
    await Promise.all([
      read('studio-luxus-blog/sanity.config.ts'),
      read('studio-luxus-blog/sanity.cli.ts'),
      read('studio-luxus-blog/schemaTypes/postType.ts'),
      read('assets/js/scripts.js'),
      read('assets/js/blog-engine.js'),
      read('assets/js/post-loader.js'),
      read('generate-sitemap.mjs'),
    ])

  for (const [key, value] of Object.entries(ROOT_CONFIG)) {
    assertIncludes(studioConfig, value, `Studio config usa ${key}`)
    if (key !== 'apiVersion') assertIncludes(studioCli, value, `Sanity CLI usa ${key}`)
    assertIncludes(scripts, value, `Frontend usa ${key}`)
    assertIncludes(sitemap, value, `Sitemap usa ${key}`)
  }

  assertIncludes(postSchema, "name: 'content'", 'Schema define content Portable Text')
  assertIncludes(postSchema, "type: 'block'", 'Schema permite bloques Portable Text')
  assertIncludes(postSchema, "type: 'image'", 'Schema permite imágenes inline')
  assertIncludes(postSchema, 'validation: (rule) => rule.required().min(1)', 'Schema exige cuerpo del artículo')
  assertIncludes(blogEngine, 'defined(slug.current)', 'Blog lista solo posts con slug')
  assertIncludes(blogEngine, 'coalesce(categories[]->title, [])', 'Blog tolera posts sin categorías')
  assertIncludes(postLoader, 'content[]{', 'Post loader consulta content')
  assertIncludes(postLoader, 'portableTextToHtml', 'Post loader serializa Portable Text')
  assertIncludes(postLoader, 'article-schema', 'Post loader genera Article schema')
  assertIncludes(sitemap, 'defined(slug.current)', 'Sitemap ignora posts sin slug')

  const query = '*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...1]{title,"slug":slug.current,publishedAt,excerpt,"contentCount":count(content),"hasImage":defined(mainImage.asset._ref)}'
  const url = `https://${ROOT_CONFIG.projectId}.apicdn.sanity.io/v${ROOT_CONFIG.apiVersion}/data/query/${ROOT_CONFIG.dataset}?query=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Sanity API respondió ${response.status}`)
  }

  const json = await response.json()
  const post = json.result?.[0]
  if (!post) {
    warnings.push('No hay posts publicados con slug en Sanity.')
  } else {
    if (!post.contentCount) warnings.push(`El post "${post.title}" no tiene contenido Portable Text.`)
    if (!post.hasImage) warnings.push(`El post "${post.title}" no tiene imagen principal.`)
    checks.push(`API pública devuelve post: ${post.title}`)
  }

  console.log('✅ Integración Sanity verificada.')
  checks.forEach((check) => console.log(`  - ${check}`))
  warnings.forEach((warning) => console.warn(`⚠️  ${warning}`))
} catch (error) {
  console.error('❌ Integración Sanity incompleta.')
  console.error(error.message)
  process.exit(1)
}
