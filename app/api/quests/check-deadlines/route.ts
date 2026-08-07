import { NextResponse } from "next/server"
import { processOverdueQuests } from "@/lib/lifemmo-repository"

export async function GET() {
  try {
    const result = await processOverdueQuests()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[check-deadlines Error]:", error)
    return NextResponse.json(
      { error: "Failed to check overdue deadlines." },
      { status: 500 }
    )
  }
}