import { redirect } from "next/navigation";
import { resolveRole, type UserRole, type ResolvedUserRole } from "./resolveRole";

function redirectByRole(role: UserRole) {
  if (role === "guest") {
    redirect("/login");
  }

  if (role === "admin") {
    redirect("/admin");
  }

  if (role === "vendor") {
    redirect("/vendor/manage");
  }

  if (role === "buyer") {
    redirect("/buyer");
  }

  if (role === "farmer") {
    redirect("/expo");
  }

  redirect("/");
}

export async function requireRole(
  allowed: UserRole[]
): Promise<ResolvedUserRole> {
  const session = await resolveRole();

  if (!allowed.includes(session.role)) {
    redirectByRole(session.role);
  }

  return session;
}