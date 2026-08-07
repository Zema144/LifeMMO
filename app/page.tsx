export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageClient } from "@/app/page-client"
import { getHomeData } from "@/lib/lifemmo-home"

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  // Якщо гравець ще не пройшов створення персонажа — кидаємо на онбординг
  if (user && !user.isOnboarded) {
    redirect("/onboarding")
  }

  const data = await getHomeData()

  return (
    <PageClient
      currentUserId={data.currentUserId}
      initialPlayer={data.player}
      initialSkillTrees={data.skillTrees}
      initialActiveTrees={data.activeTrees}
      initialAcceptedQuestIds={data.acceptedQuestIds}
      initialExtraQuests={data.extraQuests || []}
      initialDebuffedQuestSlugs={data.debuffedQuestSlugs}
    />
  )
}
