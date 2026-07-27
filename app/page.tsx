import { PageClient } from "@/app/page-client"
import { getHomeData } from "@/lib/lifemmo-home"

export default async function Page() {
  const data = await getHomeData()

  return (
    <PageClient
      currentUserId={data.currentUserId}
      initialPlayer={data.player}
      initialSkillTrees={data.skillTrees}
      initialActiveTrees={data.activeTrees}
      initialAcceptedQuestIds={data.acceptedQuestIds}
    />
  )
}
