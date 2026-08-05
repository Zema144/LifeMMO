import { google } from "@ai-sdk/google"
import { generateText, generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// --- КОНСТАНТИ ЕНЕРГІЇ ---
const MAX_ENERGY = 3
const REFILL_INTERVAL_MS = 8 * 60 * 60 * 1000 // 4 години в мілісекундах

const questVerificationSchema = z.object({
  approved: z.boolean(),
  feedback: z.string(),
  penaltyQuest: z
    .object({
      title: z.string(),
      description: z.string(),
      statPenalty: z.object({
        stat: z.enum(["STR", "INT", "CHA", "DEX"]),
        value: z.number().negative(),
      }),
    })
    .nullable(),
})

export async function POST(req: Request) {
  try {
    // 1. АВТОРИЗАЦІЯ ТА ОТРИМАННЯ КОРИСТУВАЧА
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ content: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ content: "User not found" }, { status: 404 })
    }

    // 2. ЛОГІКА РЕГЕНЕРАЦІЇ ЕНЕРГІЇ
    const now = new Date()
    const timeSinceLastRefill = now.getTime() - user.lastEnergyRefillAt.getTime()
    
    let currentEnergy = user.mentorEnergy
    let newLastRefillAt = user.lastEnergyRefillAt

    // Якщо пройшло достатньо часу для відновлення хоча б 1 енергії
    if (timeSinceLastRefill >= REFILL_INTERVAL_MS && currentEnergy < MAX_ENERGY) {
      const energyToAdd = Math.floor(timeSinceLastRefill / REFILL_INTERVAL_MS)
      currentEnergy = Math.min(MAX_ENERGY, currentEnergy + energyToAdd)
      
      // Зсуваємо час останнього поповнення на відповідну кількість інтервалів
      newLastRefillAt = new Date(user.lastEnergyRefillAt.getTime() + (energyToAdd * REFILL_INTERVAL_MS))
    }

    // 3. ПЕРЕВІРКА ЛІМІТУ ЕНЕРГІЇ
    if (currentEnergy <= 0) {
      // Повертаємо 403 і спеціальний текст, щоб фронтенд міг це красиво обробити
      return NextResponse.json(
        { 
          error: "OUT_OF_ENERGY", 
          content: "You have run out of energy to speak with your Mentors. Wait for it to restore or buy an Energy Potion." 
        }, 
        { status: 403 }
      )
    }

    // 4. СПИСАННЯ ЕНЕРГІЇ
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mentorEnergy: currentEnergy - 1,
        lastEnergyRefillAt: currentEnergy === MAX_ENERGY ? now : newLastRefillAt,
      }
    })

    // 5. ЛОГІКА ШІ (ПРОМПТИ)
    const { messages, category, mode, questTitle, questDescription } = await req.json()

    let systemPrompt = ""
    const cat = category?.trim().toUpperCase() || ""

    // 🏋️‍♂️ OGRE GROMGAR (STR, DEX, Physical, WARRIOR)
    if (cat === "WARRIOR" || cat === "STR" || cat === "DEX" || cat === "PHYSICAL") {
      systemPrompt = `You are Ogre Warlord Gromgar. Your only goal is to make the player train.
YOUR ROLEPLAY PERSONA:
- Speak like a dumb, harsh, and strong Ogre warlord.
- Use concepts like: "Iron", "Muscles", "Sweat", "Weakling", "Push", "Fight", "Arena".

STRICT PROHIBITIONS (NO EXCEPTIONS):
1. ABSOLUTELY FORBIDDEN to use IT/programming terms! No "loops", "for", "range", "delay", "scripts", "algorithms", "code", "syntax", "matrices".
2. NO magic terms ("mana", "spells", "calibration", "nodes").
3. Keep text to a MAXIMUM of 2-3 sentences. No lectures!

CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`

    // 🧙‍♂️ WISE MAGE ELDOR (INT, Hard Skills, CRAFT, WIZARD)
    } else if (cat === "WIZARD" || cat === "INT" || cat === "CRAFT" || cat === "HARD-SKILLS") {
      systemPrompt = `You are Wise Mage Eldor, a mentor of sciences and coding.
Speak academically, with restraint, and concisely (maximum 2 short paragraphs). Explain strictly to the point.
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`

    // 𝓔 ELF LYRANA (CHA, Soft Skills, ELF, MERCHANT, BARD)
    } else if (cat === "ELF" || cat === "CHA" || cat === "MERCHANT" || cat === "BARD" || cat === "SOFT-SKILLS") {
      systemPrompt = `You are Elf Lyrana, a spiritual mentor of communication, wealth, and charisma.
Speak softly, supportively, and concisely (maximum 2 short paragraphs).
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`
    } else {
      systemPrompt = `You are the Game Master of LifeMMO. Answer briefly and to the point.
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`
    }

    const selectedModel = google("models/gemini-1.5-flash-latest") 

    if (mode === "verify") {
      const { object } = await generateObject({
        model: selectedModel,
        schema: questVerificationSchema,
        system: `${systemPrompt}\n\nEvaluate the report for the quest "${questTitle}": ${questDescription}.`,
        prompt: messages[messages.length - 1]?.content || "",
      })
      return NextResponse.json(object)
    }

    // Keep only the last 3 messages to drop old context and stay in character
    const recentMessages = messages.slice(-3)

    const { text } = await generateText({
      model: selectedModel,
      system: `${systemPrompt}\n\nQuest: "${questTitle}" (${questDescription}). Respond strictly in your character persona.`,
      messages: recentMessages,
    })

    return NextResponse.json({ content: text })
  } catch (error: any) {
    console.error("AI Route Error:", error)
    return NextResponse.json(
      { content: "🧙‍♂️ The mentor is currently pondering a spell. Please try again later!" },
      { status: 500 }
    )
  }
}