"use client";

import React, { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type VendorApplication = {
  id: string;
  company_name: string;
  ceo_name: string;
  biz_no: string;
  open_date: string | null;
  email: string | null;
  phone: string | null;
  biz_type: string | null;
  business_license_file_url: string | null;
  corporate_file_url: string | null;
  review_status: string | null;
  reject_reason: string | null;
  verification_source: string | null;
  verification_result: any;
  created_at: string | null;
  reviewed_at: string | null;
};

export default function VendorApplicationsAdminPage() {
  const [items, setItems] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendor-applications");
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "신청 목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }

      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(applicationId: string) {
    const ok = confirm("이 신청을 승인하시겠습니까?");
    if (!ok) return;

    const res = await fetch("/api/admin/approve-vendor-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ application_id: applicationId }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      alert(data?.error ?? "승인 처리 실패");
      return;
    }

    alert("승인 완료되었습니다.");
    await load();
  }

  async function reject(applicationId: string) {
    const res = await fetch("/api/admin/reject-vendor-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        application_id: applicationId,
        reject_reason: rejectReason,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      alert(data?.error ?? "반려 처리 실패");
      return;
    }

    alert("반려 처리되었습니다.");
    setRejectTargetId(null);
    setRejectReason("");
    await load();
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>ADMIN REVIEW</div>
            <h1 style={S.title}>업체 입점 신청 검토</h1>
            <div style={S.desc}>
              신규 업체 신청서를 검토하고 승인 또는 반려할 수 있습니다.
            </div>
          </div>

          <button onClick={load} style={S.ghostBtn}>
            새로고침
          </button>
        </div>

        {loading ? (
          <div style={S.emptyBox}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={S.emptyBox}>접수된 신청서가 없습니다.</div>
        ) : (
          <div style={S.list}>
            {items.map((item) => (
              <section key={item.id} style={S.card}>
                <div style={S.topRow}>
                  <div>
                    <div style={S.company}>{item.company_name}</div>
                    <div style={S.meta}>
                      대표자: {item.ceo_name} · 사업자번호: {item.biz_no}
                    </div>
                  </div>

                  <div
                    style={{
                      ...S.status,
                      ...(item.review_status === "approved"
                        ? S.statusApproved
                        : item.review_status === "rejected"
                        ? S.statusRejected
                        : item.review_status === "manual_review"
                        ? S.statusManual
                        : S.statusSubmitted),
                    }}
                  >
                    {item.review_status || "submitted"}
                  </div>
                </div>

                <div style={S.infoGrid}>
                  <Info label="사업자 유형" value={item.biz_type || "-"} />
                  <Info label="개업일자" value={item.open_date || "-"} />
                  <Info label="이메일" value={item.email || "-"} />
                  <Info label="연락처" value={item.phone || "-"} />
                  <Info
                    label="검증 소스"
                    value={item.verification_source || "-"}
                  />
                  <Info
                    label="접수일"
                    value={formatDate(item.created_at)}
                  />
                </div>

                <div style={S.filesWrap}>
                  <a
                    href={item.business_license_file_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={S.linkBtn}
                  >
                    사업자등록증 보기
                  </a>

                  {item.corporate_file_url ? (
                    <a
                      href={item.corporate_file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={S.linkBtn}
                    >
                      법인등기 보기
                    </a>
                  ) : null}
                </div>

                <div style={S.verifyBox}>
                  <div style={S.verifyTitle}>검증 결과</div>
                  <pre style={S.verifyPre}>
                    {JSON.stringify(item.verification_result ?? {}, null, 2)}
                  </pre>
                </div>

                {item.reject_reason ? (
                  <div style={S.rejectBox}>
                    반려사유: {item.reject_reason}
                  </div>
                ) : null}

                <div style={S.actionRow}>
                  <button
                    onClick={() => approve(item.id)}
                    style={S.primaryBtn}
                    disabled={item.review_status === "approved"}
                  >
                    승인
                  </button>

                  <button
                    onClick={() => {
                      setRejectTargetId(item.id);
                      setRejectReason(item.reject_reason || "");
                    }}
                    style={S.dangerBtn}
                  >
                    반려
                  </button>
                </div>

                {rejectTargetId === item.id ? (
                  <div style={S.rejectEditor}>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력해 주세요."
                      style={S.textarea}
                    />

                    <div style={S.actionRow}>
                      <button
                        onClick={() => reject(item.id)}
                        style={S.dangerBtn}
                      >
                        반려 확정
                      </button>

                      <button
                        onClick={() => {
                          setRejectTargetId(null);
                          setRejectReason("");
                        }}
                        style={S.ghostBtn}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={S.infoItem}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{value}</div>
    </div>
  );
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    padding: 24,
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
  },
  list: {
    display: "grid",
    gap: 16,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 20,
    background: "#fff",
    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  company: {
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  meta: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
  },
  status: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
  },
  statusSubmitted: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  statusManual: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  statusApproved: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  statusRejected: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  infoGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  infoItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fafafa",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  infoValue: {
    marginTop: 6,
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  filesWrap: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  linkBtn: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    textDecoration: "none",
  },
  verifyBox: {
    marginTop: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "#f8fafc",
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  verifyPre: {
    marginTop: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    color: "#334155",
    lineHeight: 1.7,
  },
  rejectBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    lineHeight: 1.7,
  },
  rejectEditor: {
    marginTop: 16,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 16,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 14,
    boxSizing: "border-box",
    resize: "vertical",
    fontSize: 14,
  },
  actionRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    fontWeight: 950,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  emptyBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
};