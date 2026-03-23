import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login/buyer");
  }

  if (!profile || profile.role !== "buyer") {
    redirect("/login");
  }

  return <>{children}</>;
}