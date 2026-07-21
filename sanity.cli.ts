import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'tu-project-id', // Reemplaza con tu Project ID
    dataset: 'production'     // Reemplaza con tu dataset
  }
})
