import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateCustomQuestWithAI } from "@/lib/gemini-service"
import { createCustomQuest } from "@/lib/lifemmo-repository"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, treeSlug, hoursToComplete } = await req.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Quest title is required." },
        { status: 400 }
      )
    }

    const validation = await validateCustomQuestWithAI(title, description)

    if (validation.status !== "APPROVED") {
      return NextResponse.json(
        {
          status: validation.status,
          error: validation.reason,
        },
        { status: 400 }
      )
    }

    const quest = await createCustomQuest({
      userId: session.user.id,
      title,
      description: description || "",
      treeSlug: treeSlug || "fitness",
      hoursToComplete: Number(hoursToComplete) || 24,
      xpReward: validation.xpReward || 60,
      goldReward: validation.goldReward || 30,
    })

    return NextResponse.json({
      quest,
      reason: validation.reason,
    })
  } catch (error) {
    console.error("[custom-quest Error]:", error)
    return NextResponse.json(
      { error: "Failed to create custom quest." },
      { status: 500 }
    )
  }
}