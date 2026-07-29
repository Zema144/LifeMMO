import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { treeId } = await req.json()
  
  try {
    // Шукаємо ID дерева за його слагом
    const tree = await prisma.skillTree.findUnique({ where: { slug: treeId } })
    if (!tree) return NextResponse.json({ error: "Tree not found" }, { status: 404 })

    await prisma.userSkillTree.upsert({
      where: {
        userId_skillTreeId: {
          userId: session.user.id,
          skillTreeId: tree.id,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        skillTreeId: tree.id,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to join tree" }, { status: 500 })
  }
}