import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login/vendor");
  }

  if (!profile || profile.role !== "vendor") {
    redirect("/login");
  }

  return <>{children}</>;
}