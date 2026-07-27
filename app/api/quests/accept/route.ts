import { NextResponse } from "next/server"
import { acceptQuest } from "@/lib/lifemmo-repository"
import { getPostHogClient } from "@/lib/posthog-server"
import { analyticsEvents } from "@/lib/analytics-events"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string
    questSlug?: string
  }

  if (!body.userId || !body.questSlug) {
    return NextResponse.json({ error: "userId and questSlug are required." }, { status: 400 })
  }

  const userQuest = await acceptQuest(body.userId, body.questSlug)

  const posthog = getPostHogClient()
  if (posthog) {
    posthog.capture({
      distinctId: body.userId,
      event: analyticsEvents.questAcceptedServer,
      properties: {
        quest_slug: body.questSlug,
      },
    })
    await posthog.flush()
  }

  return NextResponse.json({ userQuest })
}
