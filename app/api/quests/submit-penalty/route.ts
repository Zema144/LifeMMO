import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyPenaltyPhotoWithAI } from "@/lib/gemini-service"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questTitle, questDescription, imageBase64 } = await req.json()

    if (!questTitle || !imageBase64) {
      return NextResponse.json(
        { error: "Quest title and photo image are required." },
        { status: 400 }
      )
    }

    const verification = await verifyPenaltyPhotoWithAI(
      questTitle,
      questDescription || "",
      imageBase64
    )

    if (verification.success) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isBlocked: false },
      })
    }

    return NextResponse.json(verification)
  } catch (error) {
    console.error("[submit-penalty Error]:", error)
    return NextResponse.json(
      { error: "Failed to process photo verification." },
      { status: 500 }
    )
  }
}