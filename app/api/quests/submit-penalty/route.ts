import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { submitPenaltyProof } from "@/lib/lifemmo-repository"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questSlug, imageBase64 } = await req.json()

    if (!questSlug || !imageBase64) {
      return NextResponse.json(
        { error: "Quest slug and photo image are required." },
        { status: 400 }
      )
    }

    const result = await submitPenaltyProof(
      session.user.id,
      questSlug,
      imageBase64
    )

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }
  } catch (error) {
    console.error("[submit-penalty Error]:", error)
    return NextResponse.json(
      { error: "Failed to process photo verification." },
      { status: 500 }
    )
  }
}
