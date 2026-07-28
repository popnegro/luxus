import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './studio-luxus-blog/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Luxus Studio',
  projectId: '0otvx84b',
  dataset: 'production',
  basePath: '/studio',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
