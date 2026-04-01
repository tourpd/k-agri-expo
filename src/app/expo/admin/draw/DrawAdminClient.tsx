"use client";

import React, { useMemo, useState } from "react";

type EntryRow = {
  id: string;
  event_key: string;
  name: string;
  phone: string;
  region: string | null;
  crop: string | null;
  created_at: string;
};

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-****`;
}

export default function DrawAdminClient({
  entries,
}: {
  entries: EntryRow[];
}) {
  const [winner, setWinner] = useState<EntryRow | null>(null);
  const [running, setRunning] = useState(false);

  const dedupedEntries = useMemo(() => {
    const map = new Map<string, EntryRow>();
    for (const row of entries) {
      if (!map.has(row.phone)) {
        map.set(row.phone, row);
      }
    }
    return Array.from(map.values());
  }, [entries]);

  async function pickWinner() {
    if (!dedupedEntries.length) {
      alert("참여자가 없습니다.");
      return;
    }

    setRunning(true);
    setWinner(null);

    await new Promise((r) => setTimeout(r, 1200));

    const idx = Math.floor(Math.random() * dedupedEntries.length);
    setWinner(dedupedEntries[idx]);
    setRunning(false);
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo Admin</div>
            <h1 style={S.title}>메인 경품 랜덤 추첨</h1>
            <div style={S.desc}>
              유튜브 라이브 중 이 화면을 보며 랜덤 추첨을 진행합니다.
            </div>
          </div>
        </div>

        <div style={S.topStats}>
          <div style={S.statCard}>
            <div style={S.statValue}>{entries.length}</div>
            <div style={S.statLabel}>총 참여건수</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statValue}>{dedupedEntries.length}</div>
            <div style={S.statLabel}>중복 제거 전화번호</div>
          </div>
        </div>

        <div style={S.drawCard}>
          <div style={S.drawBadge}>🎁 이달의 경품</div>
          <div style={S.drawTitle}>영진로타리 산악형 돌분쇄기 1대</div>
          <div style={S.drawSub}>1500만원 상당</div>

          <button onClick={pickWinner} style={S.drawBtn} disabled={running}>
            {running ? "랜덤 추첨 중..." : "랜덤 추첨 시작"}
          </button>

          <div style={S.winnerBox}>
            {!winner ? (
              <div style={S.waitText}>
                {running ? "전화번호를 랜덤으로 추첨하고 있습니다..." : "추첨 대기 중"}
              </div>
            ) : (
              <>
                <div style={S.winnerLabel}>당첨 후보</div>
                <div style={S.winnerPhone}>{maskPhone(winner.phone)}</div>
                <div style={S.winnerMeta}>
                  {winner.region || "-"} · {winner.crop || "-"}
                </div>
                <div style={S.notice}>
                  라이브 방송 중 채팅창에 본인 이름을 남기면 최종 확정
                </div>
              </>
            )}
          </div>
        </div>

        <section style={S.tableSection}>
          <h2 style={S.tableTitle}>참여자 목록</h2>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>이름</th>
                  <th style={S.th}>전화번호</th>
                  <th style={S.th}>지역</th>
                  <th style={S.th}>재배작물</th>
                  <th style={S.th}>참여일시</th>
                </tr>
              </thead>
              <tbody>
                {dedupedEntries.map((row) => (
                  <tr key={row.id}>
                    <td style={S.td}>{row.name}</td>
                    <td style={S.td}>{maskPhone(row.phone)}</td>
                    <td style={S.td}>{row.region || "-"}</td>
                    <td style={S.td}>{row.crop || "-"}</td>
                    <td style={S.td}>
                      {new Date(row.created_at).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1400,
    margin: "0 auto",
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 32,
    fontWeight: 950,
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.7,
  },
  topStats: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  statCard: {
    minWidth: 180,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  statValue: {
    fontSize: 30,
    fontWeight: 950,
  },
  statLabel: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
  },
  drawCard: {
    background: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #9a3412 100%)",
    color: "#fff",
    borderRadius: 28,
    padding: 26,
    boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
  },
  drawBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 950,
  },
  drawTitle: {
    marginTop: 18,
    fontSize: 40,
    fontWeight: 950,
    lineHeight: 1.1,
  },
  drawSub: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: 950,
    color: "#fde68a",
  },
  drawBtn: {
    marginTop: 22,
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid #fff",
    background: "#fff",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
  },
  winnerBox: {
    marginTop: 24,
    borderRadius: 22,
    padding: 22,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  waitText: {
    fontSize: 18,
    fontWeight: 800,
    color: "rgba(255,255,255,0.85)",
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#fde68a",
  },
  winnerPhone: {
    marginTop: 10,
    fontSize: 48,
    fontWeight: 950,
    letterSpacing: -1,
  },
  winnerMeta: {
    marginTop: 10,
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
  },
  notice: {
    marginTop: 14,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.8,
  },
  tableSection: {
    marginTop: 24,
  },
  tableTitle: {
    fontSize: 24,
    fontWeight: 950,
    marginBottom: 12,
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  td: {
    fontSize: 14,
    color: "#334155",
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
};