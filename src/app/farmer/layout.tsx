import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login/farmer");
  }

  if (!profile || profile.role !== "farmer") {
    redirect("/login");
  }

  return <>{children}</>;
}