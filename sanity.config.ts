import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Importa tus tipos de esquema aquí si los tienes
// import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'luxus',

  projectId: 'tu-project-id', // Reemplaza con tu Project ID de Sanity
  dataset: 'production',    // Reemplaza con el nombre de tu dataset

  plugins: [structureTool(), visionTool()],

  schema: {
    types: [], // Agrega tus tipos de esquema aquí: schemaTypes
  },
})