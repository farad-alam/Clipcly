import { getInstagramStatus } from "@/app/actions/instagram"
import ConnectInstagramClient from "@/components/connect-instagram-client"

export default async function ConnectInstagramPage() {
    const instagramStatus = await getInstagramStatus()

    return <ConnectInstagramClient instagramStatus={instagramStatus} />
}
