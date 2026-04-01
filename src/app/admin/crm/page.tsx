import Link from "next/link";
import { listCrmLeads, listIssueKeysForCrm } from "@/lib/admin/crm";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ issue_key?: string }>;
}) {
  const params = await searchParams;
  const issueKey = params?.issue_key?.trim() || "";

  const [rows, issueKeys] = await Promise.all([
    listCrmLeads({
      sourceChannel: "ai_consult",
      issueKey: issueKey || undefined,
    }),
    listIssueKeysForCrm("ai_consult"),
  ]);

  return (
    <main style={S.page}>
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>ADMIN CRM</div>
            <h1 style={S.title}>AI 상담 CRM</h1>
            <p style={S.desc}>
              AI 상담 유입 리드를 모아서 보고, HOT 리드와 추천 딜까지 바로 확인하는 관리 화면입니다.
            </p>
          </div>
        </div>

        <section style={S.card}>
          <div style={S.filterHeader}>
            <div style={S.sectionTitle}>필터</div>
            <Link href="/admin/crm" style={S.resetLink}>
              전체 보기
            </Link>
          </div>

          <div style={S.filterRow}>
            <Link
              href="/admin/crm"
              style={!issueKey ? S.filterChipActive : S.filterChip}
            >
              전체
            </Link>

            {issueKeys.map((key) => (
              <Link
                key={key}
                href={`/admin/crm?issue_key=${encodeURIComponent(key)}`}
                style={issueKey === key ? S.filterChipActive : S.filterChip}
              >
                {key}
              </Link>
            ))}
          </div>
        </section>

        <section style={S.card}>
          <div style={S.summaryRow}>
            <div style={S.summaryBox}>
              <div style={S.summaryLabel}>총 AI 상담 리드</div>
              <div style={S.summaryValue}>{rows.length}</div>
            </div>

            <div style={S.summaryBox}>
              <div style={S.summaryLabel}>HOT 이상</div>
              <div style={S.summaryValue}>
                {rows.filter((r) => r.priority_rank === "HOT" || r.priority_rank === "VERY_HOT").length}
              </div>
            </div>

            <div style={S.summaryBox}>
              <div style={S.summaryLabel}>현재 필터</div>
              <div style={S.summaryValueSmall}>{issueKey || "전체"}</div>
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>리드 목록</div>

          <div style={S.leadList}>
            {rows.length === 0 ? (
              <div style={S.emptyBox}>표시할 AI 상담 리드가 없습니다.</div>
            ) : (
              rows.map((row) => {
                const isHot =
                  row.priority_rank === "HOT" || row.priority_rank === "VERY_HOT";

                return (
                  <div
                    key={row.id}
                    style={isHot ? S.leadCardHot : S.leadCard}
                  >
                    <div style={S.leadTop}>
                      <div style={S.leadMetaLeft}>
                        <div style={S.badgeRow}>
                          <span style={S.sourceBadge}>
                            {row.source_channel ?? "unknown"}
                          </span>
                          <span
                            style={
                              row.priority_rank === "VERY_HOT"
                                ? S.priorityVeryHot
                                : row.priority_rank === "HOT"
                                ? S.priorityHot
                                : row.priority_rank === "WARM"
                                ? S.priorityWarm
                                : S.priorityLow
                            }
                          >
                            {row.priority_rank ?? "LOW"}
                          </span>
                          {row.issue_key ? (
                            <span style={S.issueBadge}>{row.issue_key}</span>
                          ) : null}
                          {row.crop_key ? (
                            <span style={S.cropBadge}>{row.crop_key}</span>
                          ) : null}
                        </div>

                        <div style={S.leadTitle}>
                          {row.name || "AI 상담 사용자"}
                        </div>

                        <div style={S.leadSubMeta}>
                          점수 {row.lead_score ?? 0} · 상태 {row.status ?? "new"} · CTA{" "}
                          {row.clicked_cta ?? "-"}
                        </div>
                      </div>

                      <div style={S.leadTime}>
                        {formatDateTime(row.created_at)}
                      </div>
                    </div>

                    <div style={S.consultBox}>
                      <div style={S.consultLabel}>상담 입력 내용</div>
                      <div style={S.consultText}>
                        {row.consult_text || "입력된 상담 내용이 없습니다."}
                      </div>
                    </div>

                    <div style={S.recommendGrid}>
                      <div style={S.recommendPanel}>
                        <div style={S.recommendTitle}>추천 딜</div>
                        {Array.isArray(row.recommended_deals) && row.recommended_deals.length > 0 ? (
                          <div style={S.recommendList}>
                            {row.recommended_deals.map((item: any, idx: number) => (
                              <div key={`${row.id}-deal-${idx}`} style={S.recommendItem}>
                                <div>
                                  <div style={S.recommendName}>
                                    {item?.deal_title ?? "추천 딜"}
                                  </div>
                                  <div style={S.recommendReason}>
                                    {item?.reason ?? ""}
                                  </div>
                                </div>
                                <Link
                                  href={item?.deal_url ?? "/expo/deals"}
                                  style={S.recommendLinkDeal}
                                >
                                  바로 보기 →
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={S.recommendEmpty}>추천 딜이 없습니다.</div>
                        )}
                      </div>

                      <div style={S.recommendPanel}>
                        <div style={S.recommendTitle}>추천 부스</div>
                        {Array.isArray(row.recommended_booths) && row.recommended_booths.length > 0 ? (
                          <div style={S.recommendList}>
                            {row.recommended_booths.map((item: any, idx: number) => (
                              <div key={`${row.id}-booth-${idx}`} style={S.recommendItem}>
                                <div>
                                  <div style={S.recommendName}>
                                    {item?.booth_name ?? "추천 부스"}
                                  </div>
                                  <div style={S.recommendReason}>
                                    {item?.reason ?? ""}
                                  </div>
                                </div>
                                <Link
                                  href={item?.booth_url ?? "/expo/booths"}
                                  style={S.recommendLink}
                                >
                                  보기 →
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={S.recommendEmpty}>추천 부스가 없습니다.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ ...S.recommendPanel, marginTop: 14 }}>
                      <div style={S.recommendTitle}>추천 제품</div>
                      {Array.isArray(row.recommended_products) && row.recommended_products.length > 0 ? (
                        <div style={S.recommendList}>
                          {row.recommended_products.map((item: any, idx: number) => (
                            <div key={`${row.id}-product-${idx}`} style={S.recommendItem}>
                              <div>
                                <div style={S.recommendName}>
                                  {item?.product_name ?? "추천 제품"}
                                </div>
                                <div style={S.recommendReason}>
                                  {item?.reason ?? ""}
                                </div>
                              </div>
                              <Link
                                href={item?.product_url ?? "/expo/consult"}
                                style={S.recommendLinkGhost}
                              >
                                보기 →
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={S.recommendEmpty}>추천 제품이 없습니다.</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "24px 16px 40px",
  },
  container: {
    maxWidth: 1360,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.7,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 900,
  },
  resetLink: {
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
    color: "#475569",
  },
  filterRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  filterChip: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontSize: 14,
    fontWeight: 800,
  },
  filterChipActive: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #16a34a",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: 14,
    fontWeight: 900,
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  summaryBox: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 800,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  },
  summaryValueSmall: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  leadList: {
    marginTop: 16,
    display: "grid",
    gap: 16,
  },
  leadCard: {
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 18,
  },
  leadCardHot: {
    borderRadius: 22,
    border: "1px solid #f59e0b",
    background: "linear-gradient(180deg, #fffdf5 0%, #ffffff 100%)",
    padding: 18,
    boxShadow: "0 12px 30px rgba(245,158,11,0.12)",
  },
  leadTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    flexWrap: "wrap",
  },
  leadMetaLeft: {
    minWidth: 0,
    flex: 1,
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  sourceBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#075985",
    fontSize: 12,
    fontWeight: 900,
  },
  priorityVeryHot: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: 12,
    fontWeight: 900,
  },
  priorityHot: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    fontSize: 12,
    fontWeight: 900,
  },
  priorityWarm: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ecfccb",
    color: "#3f6212",
    fontSize: 12,
    fontWeight: 900,
  },
  priorityLow: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
    fontSize: 12,
    fontWeight: 900,
  },
  issueBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ede9fe",
    color: "#5b21b6",
    fontSize: 12,
    fontWeight: 900,
  },
  cropBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 900,
  },
  leadTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  leadSubMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  leadTime: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  consultBox: {
    marginTop: 16,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: 14,
  },
  consultLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  consultText: {
    marginTop: 8,
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  recommendGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  recommendPanel: {
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 14,
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },
  recommendList: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },
  recommendItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    padding: "12px 0",
    borderTop: "1px solid #f1f5f9",
  },
  recommendName: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
  },
  recommendReason: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },
  recommendLink: {
    textDecoration: "none",
    background: "#15803d",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  recommendLinkGhost: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    border: "1px solid #cbd5e1",
    whiteSpace: "nowrap",
  },
  recommendLinkDeal: {
    textDecoration: "none",
    background: "#f59e0b",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  recommendEmpty: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
  },
  emptyBox: {
    borderRadius: 20,
    padding: 24,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    textAlign: "center",
  },
};