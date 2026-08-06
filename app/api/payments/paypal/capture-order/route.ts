import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "SUCCESS" }
    })

    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        mentorEnergy: 3,
        lastEnergyRefillAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayPal capture error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}