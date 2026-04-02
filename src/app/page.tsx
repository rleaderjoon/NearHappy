import { listServers } from "@/lib/db";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const servers = listServers();
  return <HomeClient initialServers={servers} />;
}
