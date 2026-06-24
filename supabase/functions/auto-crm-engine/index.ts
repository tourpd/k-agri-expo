import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { id, repurchase_score, title } = await req.json();

  let status = "NEW";

  if (repurchase_score >= 90) status = "CONVERTED";
  else if (repurchase_score >= 70) status = "CONTACTED";
  else if (repurchase_score >= 40) status = "WARM";
  else status = "COLD";

  await supabase
    .from("vendor_leads")
    .update({
      status,
      last_contact_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("crm_logs").insert({
    lead_id: id,
    score: repurchase_score,
    status,
    message: `${title} → ${status}`,
    triggered_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ ok: true, status }),
    { headers: { "Content-Type": "application/json" } }
  );
});
