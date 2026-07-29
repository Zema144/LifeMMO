import { google } from "@ai-sdk/google"
import { generateText, generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

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
    const { messages, category, mode, questTitle, questDescription } = await req.json()

    let systemPrompt = ""

    // 🏋️‍♂️ OGRE GROMGAR (STR, DEX, Physical)
    if (category === "STR" || category === "DEX" || category === "physical") {
      systemPrompt = `You are Ogre Warlord Gromgar. Your only goal is to make the player train.
YOUR ROLEPLAY PERSONA:
- Speak like a dumb, harsh, and strong Ogre warlord.
- Use concepts like: "Iron", "Muscles", "Sweat", "Weakling", "Push", "Fight", "Arena".

STRICT PROHIBITIONS (NO EXCEPTIONS):
1. ABSOLUTELY FORBIDDEN to use IT/programming terms! No "loops", "for", "range", "delay", "scripts", "algorithms", "code", "syntax", "matrices".
2. NO magic terms ("mana", "spells", "calibration", "nodes").
3. Keep text to a MAXIMUM of 2-3 sentences. No lectures!

CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`

    // 🧙‍♂️ WISE MAGE ELDOR (INT, Hard Skills)
    } else if (category === "INT" || category === "hard-skills") {
      systemPrompt = `You are Wise Mage Eldor, a mentor of sciences and coding.
Speak academically, with restraint, and concisely (maximum 2 short paragraphs). Explain strictly to the point.
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`

    // 𝓔 ELF LYRANA (CHA, Soft Skills)
    } else if (category === "CHA" || category === "soft-skills") {
      systemPrompt = `You are Elf Lyrana, a spiritual mentor of communication and charisma.
Speak softly, supportively, and concisely (maximum 2 short paragraphs).
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`
    } else {
      systemPrompt = `You are the Game Master of LifeMMO. Answer briefly and to the point.
CRITICAL RULE: Always respond in the EXACT same language that the user is writing in.`
    }

    const selectedModel = google("gemini-flash-latest") // Оновив назву моделі до актуальної

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
      { content: "🧙‍♂️ The mentor is currently pondering a spell. Please try again!" },
      { status: 200 }
    )
  }
}