import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Importa tus tipos de esquema aquí si los tienes
// import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'luxus',

  projectId: '0otvx84b',
  dataset: 'production', // Este es el valor común, confírmalo en la página de Sanity

  plugins: [structureTool(), visionTool()],

  schema: {
    types: [], // Agrega tus tipos de esquema aquí: schemaTypes
  },
})