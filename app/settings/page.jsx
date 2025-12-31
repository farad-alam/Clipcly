
import { getInstagramStatus } from "@/app/actions/instagram"
import SettingsClient from "@/components/settings-content"

export default async function SettingsPage() {
  const instagramStatus = await getInstagramStatus()
  
  return <SettingsClient instagramStatus={instagramStatus} />
}
