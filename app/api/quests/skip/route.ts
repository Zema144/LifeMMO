import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string
      questSlug?: string
    }

    if (!body.userId || !body.questSlug) {
      return NextResponse.json({ error: "userId and questSlug are required." }, { status: 400 })
    }

    const quest = await prisma.quest.findUnique({
      where: { slug: body.questSlug },
    })

    if (!quest) {
      return NextResponse.json({ error: "Quest not found." }, { status: 404 })
    }

    // CRITICAL REQUIREMENT (ТЗ розділ 7): Penalty quests CANNOT be skipped or deleted
    if (quest.isPenalty || quest.kind === "PENALTY") {
      return NextResponse.json(
        { error: "403 Forbidden: Штрафні квести неможливо пропустити чи видалити!" },
        { status: 403 }
      )
    }

    // Delete user quest association if custom or normal
    await prisma.userQuest.deleteMany({
      where: {
        userId: body.userId,
        questId: quest.id,
      },
    })

    return NextResponse.json({ success: true, message: "Квест успішно скасовано." })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to skip quest." }, { status: 500 })
  }
}
