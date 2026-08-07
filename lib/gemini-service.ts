import { GoogleGenAI } from "@google/genai"

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.")
  }
  return new GoogleGenAI({ apiKey })
}

export async function validateCustomQuestWithAI(
  title: string,
  description?: string
) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    if (title.length < 3) {
      return {
        status: "REJECTED_TOO_SIMPLE" as const,
        reason: "Rejected: Too simple (title is too short).",
      }
    }
    return {
      status: "APPROVED" as const,
      xpReward: 60,
      goldReward: 30,
      reason: "Approved (local mode).",
    }
  }

  try {
    const ai = getAiClient()
    const prompt = `You are a Gatekeeper and Quest Balancer in the LifeMMO RPG game.
Evaluate the realism and appropriateness of the custom quest created by the user:
Title: "${title}"
Description: "${description || "No description provided"}"

Evaluation Rules:
1. If the quest is impossibly difficult, unrealistic, or physically/logically impossible to complete in one day (e.g., "20,000 pull-ups", "earn $1,000,000 in an hour", "learn Chinese in 5 minutes", "run 500 km"), reject it:
   {"status": "REJECTED_UNREALISTIC", "reason": "Explanation in the user's input language why this is unrealistic"}

2. If the quest is too simple, microscopic, or effortless (e.g., "blink twice", "read half a page", "inhale air", "open eyes"), reject it:
   {"status": "REJECTED_TOO_SIMPLE", "reason": "Explanation in the user's input language why this is too simple"}

3. If the quest is realistic and well-balanced (e.g., "do 20 push-ups", "read 15 pages of a book", "clean workspace", "learn 10 foreign words"):
   Generate appropriate rewards: XP (from 30 to 200) and Gold (from 10 to 80) based on effort.
   {"status": "APPROVED", "xpReward": 70, "goldReward": 35, "reason": "Quest approved successfully!"}

IMPORTANT: The "reason" field MUST be written in the same language as the quest Title/Description provided by the user.
Respond EXCLUSIVELY in valid JSON format without markdown block formatting.`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const text = response.text?.trim() || ""
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleanJson)

    if (parsed.status === "REJECTED_UNREALISTIC") {
      return {
        status: "REJECTED_UNREALISTIC" as const,
        reason: parsed.reason || "Rejected: Unrealistic quest.",
      }
    }
    if (parsed.status === "REJECTED_TOO_SIMPLE") {
      return {
        status: "REJECTED_TOO_SIMPLE" as const,
        reason: parsed.reason || "Rejected: Too simple.",
      }
    }

    return {
      status: "APPROVED" as const,
      xpReward: Number(parsed.xpReward) || 60,
      goldReward: Number(parsed.goldReward) || 30,
      reason: parsed.reason || "Quest approved successfully!",
    }
  } catch (error) {
    console.error("[validateCustomQuestWithAI Error]:", error)
    return {
      status: "APPROVED" as const,
      xpReward: 50,
      goldReward: 25,
      reason: "Automatically approved.",
    }
  }
}

export async function generatePenaltyQuestWithAI(
  failedQuestTitle: string,
  failedQuestDescription?: string
) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      title: `Penalty x2: Double requirement for "${failedQuestTitle}"`,
      description: `You failed "${failedQuestTitle}". To unlock your account, complete double the original task and submit photo proof!`,
    }
  }

  try {
    const ai = getAiClient()
    const prompt = `You are a strict Quest Master in the LifeMMO RPG game.
The player failed the following quest: "${failedQuestTitle}".
Failed quest description: "${failedQuestDescription || "No description provided"}".

Generate a new PENALTY quest in the same theme, but with double the volume or difficulty (x2).
For example:
- If original was "Do 20 push-ups", penalty is "Do 40 push-ups and 20 sit-ups".
- If original was "Read 10 pages", penalty is "Read 20 pages and write a summary".

IMPORTANT: The "title" and "description" fields MUST be written in the same language as the failed quest Title ("${failedQuestTitle}").
Respond EXCLUSIVELY in valid JSON format without markdown block formatting:
{
  "title": "Penalty quest title (short)",
  "description": "Detailed x2 penalty quest description with clear instructions for photo proof"
}`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const text = response.text?.trim() || ""
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleanJson)

    return {
      title: parsed.title || `Penalty x2: "${failedQuestTitle}"`,
      description: parsed.description || `Failed "${failedQuestTitle}". Complete double requirement to regain access.`,
    }
  } catch (error) {
    console.error("[generatePenaltyQuestWithAI Error]:", error)
    return {
      title: `Penalty x2: "${failedQuestTitle}"`,
      description: `You failed "${failedQuestTitle}". To unlock your account, complete double requirement and provide photo proof!`,
    }
  }
}

export async function verifyPenaltyPhotoWithAI(
  questTitle: string,
  questDescription: string,
  imageBase64: string
) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      success: true,
      reason: "Photo verified (local mode). Account unblocked!",
    }
  }

  try {
    const ai = getAiClient()
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "")

    const prompt = `You are a strict and fair Judge in the LifeMMO RPG game.
The user submitted photo proof for a penalty quest:
Title: "${questTitle}"
Description: "${questDescription}"

Does the provided image reasonably prove that the task was actually completed?
Analyze the image carefully. If it depicts something completely unrelated (e.g. blank wall, black screen, random ceiling), reject it.

IMPORTANT: The "reason" field MUST be written in the same language as the quest Title ("${questTitle}").
Respond EXCLUSIVELY in valid JSON format without markdown block formatting:
{
  "success": true|false,
  "reason": "Short explanation of the decision in the quest's language"
}`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
    })

    const text = response.text?.trim() || ""
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleanJson)

    return {
      success: Boolean(parsed.success),
      reason: String(parsed.reason || (parsed.success ? "Completion verified!" : "Photo does not prove quest completion.")),
    }
  } catch (error) {
    console.error("[verifyPenaltyPhotoWithAI Error]:", error)
    return {
      success: false,
      reason: "Failed to process photo due to AI service error. Please try again.",
    }
  }
}