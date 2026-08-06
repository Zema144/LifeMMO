import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Створюємо запис у базі
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        provider: "PAYPAL",
        amount: 25, 
        currency: "USD",
        itemBought: "ENERGY_POTION",
      }
    })

    return NextResponse.json({ transactionId: transaction.id })
  } catch (error) {
    console.error("PayPal create order error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}