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

    const { title, description, hoursToComplete } = await req.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Quest title is required." }, { status: 400 })
    }

    const validation = await validateCustomQuestWithAI(title, description)

    if (validation.status !== "APPROVED") {
      return NextResponse.json(
        { status: validation.status, error: validation.reason },
        { status: 400 }
      )
    }

    const quest = await createCustomQuest({
      userId: session.user.id,
      title,
      description: description || "",
      hoursToComplete: Number(hoursToComplete) || 24,
      xpReward: validation.xpReward || 60,
      goldReward: validation.goldReward || 30,
    })

    return NextResponse.json({ quest, reason: validation.reason })
  } catch (error: any) {
    console.error("[custom-quest Error]:", error)
    const message = error?.message || "Failed to create custom quest."
    const status = /blocked|limit reached/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}