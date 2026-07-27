import { defineConfig, env } from "prisma/config"
import { loadEnvFile } from "node:process"

try {
  loadEnvFile(".env")
} catch {
  // Local environments can also provide DATABASE_URL directly.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "node prisma/seed.mjs",
  },
})
