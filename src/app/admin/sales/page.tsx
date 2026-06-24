"use client";

import { useEffect, useState } from "react";

export default function SalesPage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const res = await fetch("/api/vendor-leads");
    const data = await res.json();
    setLeads(data || []);
  }

  async function action(url: string, id: string) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchLeads();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        자동 영업 리스트
      </h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>회사</th>
            <th style={{ textAlign: "left", padding: 8 }}>상태</th>
            <th style={{ textAlign: "left", padding: 8 }}>점수</th>
            <th style={{ textAlign: "left", padding: 8 }}>액션</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td style={{ padding: 8 }}>{l.title}</td>
              <td style={{ padding: 8 }}>{l.status}</td>
              <td style={{ padding: 8 }}>{l.repurchase_score}</td>

              <td style={{ padding: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => action("/api/vendor-leads/contact", l.id)}>
                    CONTACT
                  </button>

                  <button onClick={() => action("/api/vendor-leads/convert", l.id)}>
                    CONVERT
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
