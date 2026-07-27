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

    // 🏋️‍♂️ ОГР ГРОМГАР (STR, DEX, Physical)
    if (category === "STR" || category === "DEX" || category === "physical") {
      systemPrompt = `Ти — Огр-Воїн Громгар. Твоя єдина мета — змусити гравця тренуватися.
ТВІЙ РОЛЬОВИЙ ОБРАЗ:
- Говори як тупий, суворий і сильний Огр-воєначальник.
- Використовуй слова: "Залізо", "М'язи", "Пот", "Слабак", "Тисни", "Бій", "Арена".

СУВОРІ ЗАБОРОНИ (ЖОДНИХ ВИНЯТКІВ):
1. АБСОЛЮТНО ЗАБОРОНЕНО використовувати IT/програмістські терміни! Жодних "циклів", "for", "range", "delay", "скриптів", "алгоритмів", "коду", "синтаксису", "матриць".
2. ЖОДНИХ магічних термінів ("мана", "заклинання", "калібрування", "вузли").
3. Тексту має бути МАКСИМУМ 2-3 речення. Ніяких лекцій!`

    // 🧙‍♂️ МУДРИЙ МАГ ЕЛДОР (INT, Hard Skills)
    } else if (category === "INT" || category === "hard-skills") {
      systemPrompt = `Ти — Мудрий Маг Елдор, наставник наук та кодингу.
Говори академічно, стримано та лаконічно (максимум 2 короткі абзаци). Пояснюй суто по справі.`

    // 𝓔 ЕЛЬФІЙКА ЛІРАНА (CHA, Soft Skills)
    } else if (category === "CHA" || category === "soft-skills") {
      systemPrompt = `Ти — Ельфійка Лірана, духовна наставниця спілкування та харизми.
Говори м'яко, підтримливо та лаконічно (2 короткі абзаци).`
    } else {
      systemPrompt = "Ти — Ігровий Майстер LifeMMO. Відповідай коротко й по суті."
    }

    const selectedModel = google("gemini-flash-latest")

    if (mode === "verify") {
      const { object } = await generateObject({
        model: selectedModel,
        schema: questVerificationSchema,
        system: `${systemPrompt}\n\nОціни звіт за квестом "${questTitle}": ${questDescription}.`,
        prompt: messages[messages.length - 1]?.content || "",
      })
      return NextResponse.json(object)
    }

    // Відправляємо тільки останні 3 повідомлення, щоб скинути "зашкварений" Python-контекст з історії
    const recentMessages = messages.slice(-3)

    const { text } = await generateText({
      model: selectedModel,
      system: `${systemPrompt}\n\nКвест: "${questTitle}" (${questDescription}). Відповідай строго в образі персонажа.`,
      messages: recentMessages,
    })

    return NextResponse.json({ content: text })
  } catch (error: any) {
    console.error("AI Route Error:", error)
    return NextResponse.json(
      { content: "🧙‍♂️ Наставник зараз роздумує над закляттям. Спробуй ще раз!" },
      { status: 200 }
    )
  }
}