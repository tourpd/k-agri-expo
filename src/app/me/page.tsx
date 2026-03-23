import { redirect } from "next/navigation";
import { getCurrentUserAndProfile, getRoleHome } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/login");
  }

  redirect(getRoleHome(profile.role));
}