import { createSupabaseServerClient } from "@/lib/supabase/server";
import PageBuilderClient from "./PageBuilderClient";

export const dynamic = "force-dynamic";

export default async function PageBuilderPage() {
  const supabase = await createSupabaseServerClient();

  const { data: pages } = await supabase
    .from("expo_pages")
    .select("*")
    .order("created_at");

  const page = pages?.[0];

  const { data: blocks } = await supabase
    .from("expo_page_blocks")
    .select("*")
    .eq("page_id", page?.id)
    .order("sort_order");

  return (
    <PageBuilderClient
      page={page}
      blocks={blocks ?? []}
    />
  );
}