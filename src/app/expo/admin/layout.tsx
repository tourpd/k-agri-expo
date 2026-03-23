import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/admin");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/login");
  }

  return <>{children}</>;
}