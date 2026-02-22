"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminVendors() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("vendors")
      .select("*, vendor_reviews(*)")
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>업체 심사</h1>

      {rows.map((v) => {
        const review = v.vendor_reviews?.[0];

        return (
          <div
            key={v.vendor_id}
            style={{
              border: "1px solid #eee",
              padding: 12,
              marginTop: 12,
            }}
          >
            <strong>{v.company_name}</strong>

            <div>
              사업자 상태:
              {review?.biz_status === "계속사업자" && " 🟢 정상"}
              {review?.biz_status === "휴업자" && " 🟡 휴업"}
              {review?.biz_status === "폐업자" && " 🔴 폐업"}
            </div>

            <div>AI Score: {review?.ai_score ?? "-"}</div>

            <pre style={{ fontSize: 12 }}>
              {JSON.stringify(review?.ai_flags, null, 2)}
            </pre>

            <button
              onClick={() =>
                supabase
                  .from("vendors")
                  .update({ verify_status: "approved" })
                  .eq("vendor_id", v.vendor_id)
              }
            >
              승인
            </button>
          </div>
        );
      })}
    </main>
  );
}
