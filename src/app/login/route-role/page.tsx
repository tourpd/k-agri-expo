import { redirect } from "next/navigation";
import { resolveRole } from "@/lib/auth/resolveRole";

export const dynamic = "force-dynamic";

export default async function LoginRouteRolePage() {
  const session = await resolveRole();

  if (session.role === "admin") {
    redirect("/admin");
  }

  if (session.role === "vendor") {
    redirect("/vendor/manage");
  }

  if (session.role === "buyer") {
    redirect("/buyer");
  }

  if (session.role === "farmer") {
    redirect("/expo");
  }

  redirect("/");
}