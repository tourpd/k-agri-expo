import BoothsListClient from "@/app/BoothsListClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <BoothsListClient />
    </main>
  );
}