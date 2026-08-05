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

    const userId = session.user.id
    
    // 1. Створюємо запис про транзакцію в нашій базі (статус PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        provider: "TELEGRAM_STARS",
        amount: 15, // 50 зірок
        currency: "XTR",
        itemBought: "ENERGY_POTION",
      }
    })

    // 2. Формуємо запит до Telegram Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is not defined in .env")
    }

    // Параметри для Telegram Stars
    const invoiceData = {
      title: "Energy Potion 🧪",
      description: "Restores your mentor energy to maximum so you can keep chatting.",
      payload: transaction.id, // Передаємо ID транзакції, щоб Телеграм повернув його нам після оплати
      provider_token: "", // ВАЖЛИВО: Для зірок це має бути саме порожній рядок!
      currency: "XTR",
      prices: [{ label: "Energy Potion", amount: 15 }]
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData)
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("Telegram API Error:", data.description)
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 400 })
    }

    // 3. Повертаємо згенерований лінк на фронтенд
    return NextResponse.json({ invoiceUrl: data.result })

  } catch (error: any) {
    console.error("Error creating Telegram Stars invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}