import WinnerAddressForm from "./WinnerAddressForm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function WinnerAddressPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: winner } = await supabase
    .from("live_winners")
    .select("*")
    .eq("address_token", token)
    .maybeSingle();

  if (!winner) {
    return (
      <main style={{ padding: 30 }}>
        <h1>잘못된 주소 입력 링크입니다.</h1>
      </main>
    );
  }

  return <WinnerAddressForm token={token} winner={winner} />;
}