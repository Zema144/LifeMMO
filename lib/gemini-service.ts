import { GoogleGenAI } from "@google/genai"

function resolveApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  )
}

function getAiClient() {
  const apiKey = resolveApiKey()
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.")
  return new GoogleGenAI({ apiKey })
}

function warnNoApiKey(fn: string) {
  console.error(
    `[gemini-service] ${fn}: API key not found (GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / GOOGLE_API_KEY). ` +
      `Falling back to local mode — NO real AI check is happening. Set a real key to fix this.`
  )
}

function extractJson(raw: string): any {
  const text = raw.replace(/```json/gi, "").replace(/```/g, "").trim()
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`AI response has no JSON object: ${text.slice(0, 300)}`)
  }
  return JSON.parse(text.slice(start, end + 1))
}

export async function validateCustomQuestWithAI(title: string, description?: string) {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    warnNoApiKey("validateCustomQuestWithAI")
    if (title.length < 3) {
      return { status: "REJECTED_TOO_SIMPLE" as const, reason: "Rejected: Too simple (title is too short)." }
    }
    return { status: "APPROVED" as const, xpReward: 60, goldReward: 30, reason: "Approved (local mode — AI key missing)." }
  }

  try {
    const ai = getAiClient()
    const prompt = `You are a Gatekeeper and Quest Balancer in the LifeMMO RPG game.
Evaluate the realism and appropriateness of the custom quest created by the user:
Title: "${title}"
Description: "${description || "No description provided"}"

Evaluation Rules:
1. If impossibly difficult/unrealistic for one day, reject: {"status": "REJECTED_UNREALISTIC", "reason": "..."}
2. If too simple/effortless, reject: {"status": "REJECTED_TOO_SIMPLE", "reason": "..."}
3. If realistic and well-balanced, approve with rewards based on effort (XP 30-200, Gold 10-80):
   {"status": "APPROVED", "xpReward": 70, "goldReward": 35, "reason": "..."}

IMPORTANT: "reason" MUST be in the same language as the quest Title/Description.
Respond EXCLUSIVELY in valid JSON, without markdown formatting.`

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt })
    const parsed = extractJson(response.text?.trim() || "")

    if (parsed.status === "REJECTED_UNREALISTIC") {
      return { status: "REJECTED_UNREALISTIC" as const, reason: parsed.reason || "Rejected: Unrealistic quest." }
    }
    if (parsed.status === "REJECTED_TOO_SIMPLE") {
      return { status: "REJECTED_TOO_SIMPLE" as const, reason: parsed.reason || "Rejected: Too simple." }
    }

    return {
      status: "APPROVED" as const,
      xpReward: Number.isFinite(Number(parsed.xpReward)) ? Number(parsed.xpReward) : 60,
      goldReward: Number.isFinite(Number(parsed.goldReward)) ? Number(parsed.goldReward) : 30,
      reason: parsed.reason || "Quest approved successfully!",
    }
  } catch (error) {
    console.error("[validateCustomQuestWithAI Error]:", error)
    return { status: "APPROVED" as const, xpReward: 60, goldReward: 30, reason: "Automatically approved (AI temporarily unavailable)." }
  }
}

export async function generatePenaltyQuestWithAI(failedQuestTitle: string, failedQuestDescription?: string) {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    warnNoApiKey("generatePenaltyQuestWithAI")
    return {
      title: `Penalty x2: ${failedQuestTitle}`,
      description: `You missed the deadline for "${failedQuestTitle}". To unblock your account, complete this task again at roughly double the effort/volume, then submit proof.\n\nOriginal task: ${failedQuestDescription || failedQuestTitle}`,
    }
  }

  try {
    const ai = getAiClient()
    const prompt = `You are a strict Quest Master in the LifeMMO RPG game.
The player failed: "${failedQuestTitle}".
Description: "${failedQuestDescription || "No description provided"}".

Generate a new PENALTY quest in the same theme, with double the volume/difficulty (x2), stated CONCRETELY with real numbers (not "do it twice").
Example: "Do 20 push-ups" -> "Do 40 push-ups and 20 sit-ups".

IMPORTANT: "title"/"description" MUST be in the same language as "${failedQuestTitle}".
Respond EXCLUSIVELY in valid JSON: {"title": "...", "description": "..."}`

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt })
    const parsed = extractJson(response.text?.trim() || "")

    return {
      title: parsed.title || `Penalty x2: "${failedQuestTitle}"`,
      description: parsed.description || `Failed "${failedQuestTitle}". Complete double requirement to regain access.`,
    }
  } catch (error) {
    console.error("[generatePenaltyQuestWithAI Error]:", error)
    return {
      title: `Penalty x2: "${failedQuestTitle}"`,
      description: `You failed "${failedQuestTitle}". To unlock your account, complete double the requirement and provide proof!`,
    }
  }
}

export async function verifyPenaltyProofWithAI(
  questTitle: string,
  questDescription: string,
  proof: { imageBase64?: string; textProof?: string }
) {
  const apiKey = resolveApiKey()
  const hasImage = Boolean(proof.imageBase64)
  const hasText = Boolean(proof.textProof?.trim())

  if (!hasImage && !hasText) {
    return { success: false, reason: "Please attach a photo or write a short description of what you did." }
  }

  if (!apiKey) {
    warnNoApiKey("verifyPenaltyProofWithAI")
    return { success: true, reason: "Proof accepted (local mode — AI key missing, no real check performed)." }
  }

  try {
    const ai = getAiClient()

    if (hasImage) {
      const mimeMatch = proof.imageBase64!.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)
      const mimeType = mimeMatch?.[1] || "image/jpeg"
      const cleanBase64 = proof.imageBase64!.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")

      const prompt = `You are a strict and fair Judge in the LifeMMO RPG game.
The user submitted photo proof${hasText ? " together with a written note" : ""} for a penalty quest:
Title: "${questTitle}"
Description: "${questDescription}"
${hasText ? `User's note: "${proof.textProof}"` : ""}

Does the image (and note, if any) reasonably prove the task was actually completed?
If the image is unrelated (blank wall, black screen, random object), reject it.

IMPORTANT: "reason" MUST be in the same language as "${questTitle}".
Respond EXCLUSIVELY in valid JSON: {"success": true|false, "reason": "..."}`

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ inlineData: { mimeType, data: cleanBase64 } }, { text: prompt }],
      })
      const parsed = extractJson(response.text?.trim() || "")
      const success = parsed.success === true || parsed.success === "true"
      return { success, reason: String(parsed.reason || (success ? "Completion verified!" : "Photo does not prove completion.")) }
    }

    const prompt = `You are a strict and fair Judge in the LifeMMO RPG game.
The user submitted a WRITTEN report (no photo) as proof for a penalty quest:
Title: "${questTitle}"
Description: "${questDescription}"
User's report: "${proof.textProof}"

Judge whether the report plausibly and specifically describes actually doing the task.
Be strict: vague reports with no concrete detail (e.g. just "done", or repeating the task title) must be REJECTED.

IMPORTANT: "reason" MUST be in the same language as "${questTitle}".
Respond EXCLUSIVELY in valid JSON: {"success": true|false, "reason": "..."}`

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt })
    const parsed = extractJson(response.text?.trim() || "")
    const success = parsed.success === true || parsed.success === "true"
    return { success, reason: String(parsed.reason || (success ? "Report accepted!" : "Report does not convincingly prove completion.")) }
  } catch (error) {
    console.error("[verifyPenaltyProofWithAI Error]:", error)
    return { success: false, reason: "Failed to process proof due to an AI service error. Please try again." }
  }
}