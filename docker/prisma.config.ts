// Config de Prisma usada dentro del contenedor (ver Dockerfile):
// vive en /app/cli junto al node_modules del CLI, con el schema en /app/prisma.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: '../prisma/schema.prisma',
  migrations: {
    path: '../prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
