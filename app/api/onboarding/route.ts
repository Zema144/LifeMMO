import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, title, gender, avatarSkin, avatarHair, avatarArmor } = await req.json()
    const trimmedName = name?.trim()

    // 1. Перевірка довжини
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 20) {
      return NextResponse.json({ error: "Name must be between 3 and 20 characters." }, { status: 400 })
    }

    // 2. Перевірка на спецсимволи
    const validNameRegex = /^[a-zA-Z0-9_]+$/
    if (!validNameRegex.test(trimmedName)) {
      return NextResponse.json({ error: "Only letters, numbers, and underscores are allowed." }, { status: 400 })
    }

    // 3. Жорстка перевірка на унікальність (шукаємо точний збіг у нижньому регістрі)
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          {
            firstName: {
              equals: trimmedName,
              mode: "insensitive", // Працює для PostgreSQL; якщо SQLite/MySQL — робимо нижче перевірку через масив
            },
          },
          {
            NOT: {
              id: session.user.id,
            },
          },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "This character name is already taken." }, { status: 400 })
    }

    let intStat = 1
    let strStat = 1
    let dexStat = 1
    let chaStat = 1

    if (title === "Mind Weaver") intStat = 2
    else if (title === "Iron Vanguard") strStat = 2
    else if (title === "Shadow Artisan") dexStat = 2
    else if (title === "Silver Orator") chaStat = 2

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: trimmedName,
        title: title || "Wanderer",
        intStat,
        strStat,
        dexStat,
        chaStat,
        gender: gender || "male",
        avatarSkin: avatarSkin || "light",
        avatarHair: avatarHair || "short",
        avatarArmor: avatarArmor || "cloth",
        isOnboarded: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}