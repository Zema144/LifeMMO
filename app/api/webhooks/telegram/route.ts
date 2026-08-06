import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.pre_checkout_query) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const queryId = body.pre_checkout_query.id

      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: queryId,
          ok: true
        })
      })

      return NextResponse.json({ status: "ok" })
    }

    const message = body.message
    if (message?.successful_payment) {
      const payment = message.successful_payment
      const transactionId = payment.invoice_payload
      const providerPaymentChargeId = payment.telegram_payment_charge_id

      // Знаходимо транзакцію в нашій базі
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })

      if (transaction && transaction.status === "PENDING") {
        // Оновлюємо статус транзакції на SUCCESS
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "SUCCESS",
            providerTxId: providerPaymentChargeId
          }
        })

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            mentorEnergy: 3,
            lastEnergyRefillAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}