import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import LiveWinnersClient from "./LiveWinnersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type LiveWinnerRow = {
  id: string;
  prize_id: string | null;
  participant_id: string | null;
  draw_number: number | null;
  prize_title: string | null;
  winner_name: string | null;
  winner_phone: string | null;
  status: string | null;

  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_zipcode?: string | null;
  shipping_address1?: string | null;
  shipping_address2?: string | null;
  shipping_memo?: string | null;
  shipping_status?: string | null;
  address_submitted_at?: string | null;
  privacy_agreed?: boolean | null;

  created_at: string | null;

  live_prizes?: {
    title?: string | null;
    sponsor?: string | null;
    category?: string | null;
    vendor_delivery_required?: boolean | null;
  } | null;
};

export default async function AdminLiveWinnersPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("live_winners")
    .select(`
      *,
      live_prizes (
        title,
        sponsor,
        category,
        vendor_delivery_required
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 30 }}>
        <h1>당첨자 배송관리 오류</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return <LiveWinnersClient initialItems={(data || []) as LiveWinnerRow[]} />;
}