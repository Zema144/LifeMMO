import { NextResponse } from "next/server"
import { completeQuest } from "@/lib/lifemmo-repository"
import { getPostHogClient } from "@/lib/posthog-server"
import { analyticsEvents } from "@/lib/analytics-events"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string
      questSlug?: string
    }

    if (!body.userId || !body.questSlug) {
      return NextResponse.json({ error: "userId and questSlug are required." }, { status: 400 })
    }

    const user = await completeQuest(body.userId, body.questSlug)

    const posthog = getPostHogClient()
    if (posthog) {
      posthog.capture({
        distinctId: body.userId,
        event: analyticsEvents.questCompletedServer,
        properties: {
          quest_slug: body.questSlug,
          new_xp: user.xp,
          new_gold: user.gold,
        },
      })
      await posthog.flush()
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to complete quest." }, { status: 403 })
  }
}
