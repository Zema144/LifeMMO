import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { loadEnvFile } from "node:process"

async function globalSetup() {
  try {
    loadEnvFile(".env")
  } catch {
    // CI can provide DATABASE_URL directly.
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for E2E tests.")
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

  await prisma.user.deleteMany({
    where: { telegramId: "local-dev" },
  })

  await prisma.$disconnect()
}

export default globalSetup
