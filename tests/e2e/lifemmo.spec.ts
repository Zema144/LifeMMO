import { expect, test } from "@playwright/test"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { loadEnvFile } from "node:process"

try {
  loadEnvFile(".env")
} catch {
  // CI can provide DATABASE_URL directly.
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for E2E tests.")
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

test("accepts and completes a fixed quest with PostgreSQL persistence", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("Georgiy")).toBeVisible()
  await expect(page.getByText("Quest Log Empty")).toBeVisible()

  await page.getByTestId("nav-trees").click()
  await page.getByTestId("node-de-n3").click()
  await expect(page.getByText("Node Quests")).toBeVisible()

  await page.getByTestId("accept-de-1").click()
  await expect(page.getByTestId("accept-de-1")).toContainText("Accepted")

  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.getByText("Node Quests")).toHaveCount(0)

  await page.getByTestId("nav-quests").click()
  await expect(page.getByText("Master PostgreSQL JOINs")).toBeVisible()

  await page.getByTestId("complete-de-1").click()
  await expect(page.getByText("Master PostgreSQL JOINs")).toHaveCount(0)

  const prisma = createPrisma()
  const user = await prisma.user.findUniqueOrThrow({
    where: { telegramId: "local-dev" },
    include: {
      quests: {
        include: { quest: true },
      },
    },
  })

  expect(user.xp).toBe(900)
  expect(user.gold).toBe(360)
  expect(user.quests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        status: "COMPLETED",
        quest: expect.objectContaining({ slug: "de-1" }),
      }),
    ]),
  )

  await prisma.$disconnect()
})
