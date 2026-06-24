import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import LivePrizesClient from "./LivePrizesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export type LivePrize = {
  id: string;
  event_id: string | null;
  title: string;
  sponsor: string | null;
  category?: string | null;
  description: string | null;
  preview_note?: string | null;
  image_url: string | null;
  video_url?: string | null;
  media_mode?: string | null;
  event_label?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  winner_note?: string | null;
  quantity: number | null;
  total_winners?: number | null;
  draw_type: string | null;
  display_group?: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  drawn_count: number | null;
  vendor_delivery_required?: boolean | null;
  deleted_at?: string | null;
  created_at: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    event_id?: string;
    eventId?: string;
  }>;
};

export default async function AdminLivePrizesPage({ searchParams }: PageProps) {
  try {
    const sp = searchParams ? await searchParams : {};
    const eventId = sp?.event_id || sp?.eventId || "";

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("live_prizes")
      .select("*")
      .is("deleted_at", null)
      .order("display_group", { ascending: true })
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;

    if (error) {
      return (
        <main style={{ padding: 30, color: "#111827" }}>
          <h1>경품 관리 오류</h1>
          <pre>{error.message}</pre>
        </main>
      );
    }

    return (
      <LivePrizesClient
        initialItems={(data || []) as LivePrize[]}
        eventId={eventId}
      />
    );
  } catch (e) {
    return (
      <main style={{ padding: 30, color: "#111827" }}>
        <h1>경품 관리 페이지 오류</h1>
        <pre>{e instanceof Error ? e.message : "server error"}</pre>
      </main>
    );
  }
}