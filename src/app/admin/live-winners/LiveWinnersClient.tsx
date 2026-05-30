"use client";

import { useMemo, useState } from "react";
import type { LiveWinnerRow } from "./page";

function safe(v: unknown, fallback = "-") {
  const s = String(v || "").trim();
  return s || fallback;
}

function phone(v: unknown) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return safe(v);
}

function statusText(v: unknown) {
  const s = String(v || "");
  if (s === "address_submitted") return "주소입력 완료";
  if (s === "need_address") return "주소입력 필요";
  if (s === "shipped") return "배송완료";
  if (s === "sent_to_vendor") return "업체전달 완료";
  return s || "확인 필요";
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: LiveWinnerRow[]) {
  const header = [
    "협찬사",
    "경품명",
    "당첨번호",
    "당첨자",
    "당첨자연락처",
    "수령자",
    "수령자연락처",
    "우편번호",
    "주소",
    "상세주소",
    "배송메모",
    "배송상태",
    "개인정보동의",
    "주소입력일",
  ];

  const body = rows.map((r) => [
    r.live_prizes?.sponsor || "",
    r.prize_title || r.live_prizes?.title || "",
    r.draw_number || "",
    r.winner_name || "",
    r.winner_phone || "",
    r.shipping_name || "",
    r.shipping_phone || "",
    r.shipping_zipcode || "",
    r.shipping_address1 || "",
    r.shipping_address2 || "",
    r.shipping_memo || "",
    statusText(r.shipping_status),
    r.privacy_agreed ? "동의" : "미동의",
    r.address_submitted_at || "",
  ]);

  const csv = [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LiveWinnersClient({
  initialItems,
}: {
  initialItems: LiveWinnerRow[];
}) {
  const [items] = useState<LiveWinnerRow[]>(initialItems || []);
  const [sponsorFilter, setSponsorFilter] = useState("전체");

  const sponsors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      set.add(item.live_prizes?.sponsor || "협찬사 미지정");
    });
    return ["전체", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (sponsorFilter === "전체") return items;
    return items.filter(
      (item) => (item.live_prizes?.sponsor || "협찬사 미지정") === sponsorFilter
    );
  }, [items, sponsorFilter]);

  const needAddressCount = items.filter(
    (item) => item.shipping_status !== "address_submitted"
  ).length;

  const submittedCount = items.filter(
    (item) => item.shipping_status === "address_submitted"
  ).length;

  const grouped = useMemo(() => {
    const map = new Map<string, LiveWinnerRow[]>();

    filteredItems.forEach((item) => {
      const sponsor = item.live_prizes?.sponsor || "협찬사 미지정";
      if (!map.has(sponsor)) map.set(sponsor, []);
      map.get(sponsor)?.push(item);
    });

    return Array.from(map.entries());
  }, [filteredItems]);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.kicker}>K-Agri Expo LIVE DELIVERY</p>
          <h1 style={styles.title}>당첨자 배송관리</h1>
          <p style={styles.desc}>
            경품 당첨자 주소를 확인하고 협찬사별 배송명단을 내려받는 화면입니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadCsv("전체_당첨자_배송명단.csv", filteredItems)}
          style={styles.downloadButton}
        >
          현재 목록 CSV 다운로드
        </button>
      </section>

      <section style={styles.stats}>
        <Stat label="전체 당첨자" value={`${items.length}명`} />
        <Stat label="주소입력 완료" value={`${submittedCount}명`} />
        <Stat label="주소입력 필요" value={`${needAddressCount}명`} />
        <Stat label="협찬사 수" value={`${sponsors.length - 1}곳`} />
      </section>

      <section style={styles.filterBox}>
        {sponsors.map((sponsor) => (
          <button
            key={sponsor}
            type="button"
            onClick={() => setSponsorFilter(sponsor)}
            style={{
              ...styles.filterButton,
              background: sponsorFilter === sponsor ? "#111827" : "white",
              color: sponsorFilter === sponsor ? "white" : "#111827",
            }}
          >
            {sponsor}
          </button>
        ))}
      </section>

      {grouped.length === 0 ? (
        <div style={styles.empty}>당첨자 데이터가 없습니다.</div>
      ) : (
        grouped.map(([sponsor, rows]) => (
          <section key={sponsor} style={styles.group}>
            <div style={styles.groupHead}>
              <div>
                <h2 style={styles.groupTitle}>{sponsor}</h2>
                <p style={styles.groupDesc}>
                  배송 대상 {rows.length}명 / 주소입력 완료{" "}
                  {rows.filter((r) => r.shipping_status === "address_submitted").length}명
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadCsv(`${sponsor}_배송명단.csv`, rows)}
                style={styles.smallDownloadButton}
              >
                이 업체 명단 다운로드
              </button>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>경품</th>
                    <th style={styles.th}>당첨번호</th>
                    <th style={styles.th}>당첨자</th>
                    <th style={styles.th}>연락처</th>
                    <th style={styles.th}>수령자</th>
                    <th style={styles.th}>주소</th>
                    <th style={styles.th}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        {safe(item.prize_title || item.live_prizes?.title)}
                      </td>
                      <td style={styles.td}>{safe(item.draw_number)}</td>
                      <td style={styles.td}>{safe(item.winner_name)}</td>
                      <td style={styles.td}>{phone(item.winner_phone)}</td>
                      <td style={styles.td}>{safe(item.shipping_name)}</td>
                      <td style={styles.td}>
                        {item.shipping_address1 ? (
                          <>
                            {safe(item.shipping_zipcode)} / {safe(item.shipping_address1)}{" "}
                            {safe(item.shipping_address2, "")}
                          </>
                        ) : (
                          <span style={styles.warning}>주소 미입력</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background:
                              item.shipping_status === "address_submitted"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              item.shipping_status === "address_submitted"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {statusText(item.shipping_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.stat}>
      <p style={styles.statLabel}>{label}</p>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 28,
    color: "#111827",
  },
  header: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "8px 0",
    fontSize: 38,
    fontWeight: 950,
  },
  desc: {
    margin: 0,
    color: "#4b5563",
    fontSize: 17,
  },
  downloadButton: {
    border: 0,
    borderRadius: 16,
    padding: "15px 18px",
    background: "#16a34a",
    color: "white",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  stats: {
    maxWidth: 1320,
    margin: "0 auto 16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  stat: {
    background: "white",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 800,
  },
  statValue: {
    display: "block",
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
  },
  filterBox: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  filterButton: {
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  group: {
    maxWidth: 1320,
    margin: "0 auto 20px",
    background: "white",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  },
  groupHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  groupTitle: {
    margin: 0,
    fontSize: 27,
    fontWeight: 950,
  },
  groupDesc: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontWeight: 800,
  },
  smallDownloadButton: {
    border: 0,
    borderRadius: 14,
    padding: "12px 15px",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 15,
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top",
  },
  statusBadge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "7px 10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  warning: {
    color: "#dc2626",
    fontWeight: 900,
  },
  empty: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 40,
    background: "white",
    borderRadius: 24,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
};