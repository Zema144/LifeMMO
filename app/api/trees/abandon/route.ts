import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string
    treeId?: string
  }

  if (!body.userId || !body.treeId) {
    return NextResponse.json({ error: "userId and treeId are required." }, { status: 400 })
  }


  const tree = await prisma.skillTree.findUnique({
    where: { slug: body.treeId },
    select: { id: true },
  })

  if (!tree) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 })
  }

  await prisma.$transaction([
    // Прибираємо неавершені прийняті квести цього дерева.
    // Завершені (COMPLETED) свідомо лишаємо — це історія реального прогресу.
    prisma.userQuest.deleteMany({
      where: {
        userId: body.userId,
        status: "ACCEPTED",
        quest: { treeId: tree.id },
      },
    }),
    // Власне вихід із дерева — саме цей запис мав видалятись,
    // інакше сервер після router.refresh() повертає дерево як і раніше активним.
    prisma.userSkillTree.deleteMany({
      where: {
        userId: body.userId,
        skillTreeId: tree.id,
      },
    }),
  ])

  return NextResponse.json({ success: true })
}