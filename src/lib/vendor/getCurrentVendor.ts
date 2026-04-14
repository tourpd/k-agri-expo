import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentVendor() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // role 체크
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isVendor = roles?.some((r) => r.role === "vendor");

  if (!isVendor) {
    redirect("/unauthorized");
  }

  // vendor 조회
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !vendor) {
    throw new Error("vendor 정보를 찾을 수 없습니다.");
  }

  return {
    user,
    vendor,
  };
}