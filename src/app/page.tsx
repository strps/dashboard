import { DashboardGrid } from "@/dashboard/components/DashboardGrid";
import { verifySession } from "@/lib/dal/session";

export default async function Home() {
  const { isAdmin } = await verifySession();
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <DashboardGrid isAdmin={isAdmin} />
    </div>
  );
}
