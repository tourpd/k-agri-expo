"use client";

import React, { useMemo, useState } from "react";

export type AdminUserRow = {
  user_id: string;
  role?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  vendor_id?: string | null;
  vendor_company_name?: string | null;
  vendor_approval_status?: string | null;
  plan_type?: string | null;
  product_limit?: number | null;
  booth_limit?: number | null;

  buyer_id?: string | null;
  buyer_company_name?: string | null;
  buyer_country?: string | null;
  buyer_language?: string | null;
  buyer_approval_status?: string | null;
  buyer_verification_status?: string | null;

  farmer_id?: string | null;
  farm_name?: string | null;
  region?: string | null;
  crops?: string | null;
  farmer_status?: string | null;
};

type PatchPayload = {
  role?: string;
  status?: string;

  vendor_approval_status?: string;
  plan_type?: string;
  product_limit?: number;
  booth_limit?: number;

  buyer_approval_status?: string;
  buyer_verification_status?: string;

  farmer_status?: string;
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ko-KR");
}

function roleLabel(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "admin":
      return "관리자";
    case "vendor":
      return "업체";
    case "buyer":
      return "바이어";
    case "farmer":
      return "농민";
    default:
      return v || "-";
  }
}

function statusLabel(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "pending":
      return "대기";
    case "active":
      return "활성";
    case "rejected":
      return "반려";
    case "suspended":
      return "중지";
    case "approved":
      return "승인";
    case "verified":
      return "검증완료";
    case "watchlist":
      return "주의";
    default:
      return v || "-";
  }
}

function planLabel(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "free":
      return "무료";
    case "basic":
      return "기본";
    case "premium":
      return "프리미엄";
    default:
      return v || "-";
  }
}

function badgeStyle(
  kind: "dark" | "green" | "yellow" | "red" | "blue" | "gray"
): React.CSSProperties {
  if (kind === "dark") {
    return { background: "#0f172a", color: "#fff", border: "1px solid #0f172a" };
  }
  if (kind === "green") {
    return { background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0" };
  }
  if (kind === "yellow") {
    return { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
  }
  if (kind === "red") {
    return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
  }
  if (kind === "blue") {
    return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  }
  return { background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" };
}

function statusKind(v?: string | null): "green" | "yellow" | "red" | "gray" {
  switch ((v || "").toLowerCase()) {
    case "active":
    case "approved":
    case "verified":
      return "green";
    case "pending":
    case "reviewing":
    case "draft":
    case "watchlist":
      return "yellow";
    case "rejected":
    case "suspended":
      return "red";
    default:
      return "gray";
  }
}

function resolveDisplayName(row: AdminUserRow) {
  return (
    safe(row.name, "") ||
    safe(row.vendor_company_name, "") ||
    safe(row.buyer_company_name, "") ||
    safe(row.farm_name, "") ||
    "이름 없음"
  );
}

function resolveSubTitle(row: AdminUserRow) {
  if (row.role === "vendor") {
    return safe(row.vendor_company_name, "업체명 없음");
  }
  if (row.role === "buyer") {
    return `${safe(row.buyer_company_name, "바이어명 없음")} / ${safe(row.buyer_country, "-")}`;
  }
  if (row.role === "farmer") {
    return `${safe(row.farm_name, "농장명 없음")} / ${safe(row.region, "-")}`;
  }
  return safe(row.email, "-");
}

function defaultPlanLimits(planType?: string | null) {
  const plan = (planType || "").toLowerCase();

  if (plan === "premium") return { product_limit: 10, booth_limit: 1 };
  if (plan === "basic") return { product_limit: 3, booth_limit: 1 };
  return { product_limit: 1, booth_limit: 1 };
}

export default function AdminUsersClient({
  initialRows,
}: {
  initialRows: AdminUserRow[];
}) {
  const [rows, setRows] = useState<AdminUserRow[]>(initialRows ?? []);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialRows?.[0]?.user_id || ""
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (roleFilter && safe(row.role, "") !== roleFilter) return false;
      if (statusFilter && safe(row.status, "") !== statusFilter) return false;

      if (!q) return true;

      const text = [
        row.user_id,
        row.role,
        row.name,
        row.phone,
        row.email,
        row.status,
        row.vendor_company_name,
        row.vendor_approval_status,
        row.buyer_company_name,
        row.buyer_country,
        row.buyer_language,
        row.buyer_approval_status,
        row.farm_name,
        row.region,
        row.crops,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return text.includes(q);
    });
  }, [rows, roleFilter, search, statusFilter]);

  const selected = useMemo(
    () => filteredRows.find((row) => row.user_id === selectedUserId) || null,
    [filteredRows, selectedUserId]
  );

  async function patchUser(userId: string, payload: PatchPayload, successText: string) {
    setActing(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "사용자 수정에 실패했습니다.");
      }

      setRows((prev) =>
        prev.map((row) => (row.user_id === userId ? { ...row, ...json.item } : row))
      );

      setNotice(successText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "사용자 수정 실패");
    } finally {
      setActing(false);
    }
  }

  async function handleVendorApprove(row: AdminUserRow) {
    const limits = defaultPlanLimits(row.plan_type);

    await patchUser(
      row.user_id,
      {
        status: "active",
        vendor_approval_status: "active",
        product_limit: row.product_limit ?? limits.product_limit,
        booth_limit: row.booth_limit ?? limits.booth_limit,
      },
      "업체 승인이 완료되었습니다."
    );
  }

  async function handleBuyerApprove(row: AdminUserRow) {
    await patchUser(
      row.user_id,
      {
        status: "active",
        buyer_approval_status: "active",
        buyer_verification_status: safe(row.buyer_verification_status, "") || "verified",
      },
      "바이어 승인이 완료되었습니다."
    );
  }

  async function handleFarmerActivate(row: AdminUserRow) {
    await patchUser(
      row.user_id,
      {
        status: "active",
        farmer_status: "active",
      },
      "농민 계정이 활성 처리되었습니다."
    );
  }

  async function handleSuspend(row: AdminUserRow) {
    await patchUser(
      row.user_id,
      {
        status: "suspended",
        vendor_approval_status: row.vendor_id ? "suspended" : undefined,
        buyer_approval_status: row.buyer_id ? "suspended" : undefined,
        farmer_status: row.farmer_id ? "suspended" : undefined,
      },
      "사용자 상태를 중지로 변경했습니다."
    );
  }

  async function handleReject(row: AdminUserRow) {
    await patchUser(
      row.user_id,
      {
        status: "rejected",
        vendor_approval_status: row.vendor_id ? "rejected" : undefined,
        buyer_approval_status: row.buyer_id ? "rejected" : undefined,
      },
      "승인 거절 처리되었습니다."
    );
  }

  async function handlePlanChange(row: AdminUserRow, planType: string) {
    const limits = defaultPlanLimits(planType);

    await patchUser(
      row.user_id,
      {
        plan_type: planType,
        product_limit: limits.product_limit,
        booth_limit: limits.booth_limit,
      },
      `업체 플랜이 ${planLabel(planType)}로 변경되었습니다.`
    );
  }

  async function handleRoleChange(row: AdminUserRow, role: string) {
    await patchUser(row.user_id, { role }, `역할이 ${roleLabel(role)}로 변경되었습니다.`);
  }

  return (
    <main style={S.page}>
      <div style={S.hero}>
        <div>
          <div style={S.eyebrow}>ADMIN USERS</div>
          <h1 style={S.title}>전체 사용자 관리</h1>
          <div style={S.desc}>
            농민, 업체, 바이어, 관리자를 한 화면에서 보고 승인, 중지, 플랜 변경까지 처리하는 운영 화면입니다.
          </div>
        </div>
      </div>

      {(notice || error) && (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {notice ? <div style={S.notice}>{notice}</div> : null}
          {error ? <div style={S.error}>{error}</div> : null}
        </div>
      )}

      <section style={S.filterBar}>
        <input
          style={S.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 회사명, 전화, 이메일, 국가, 작물로 검색"
        />

        <select style={S.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">전체 역할</option>
          <option value="admin">관리자</option>
          <option value="vendor">업체</option>
          <option value="buyer">바이어</option>
          <option value="farmer">농민</option>
        </select>

        <select style={S.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="pending">대기</option>
          <option value="active">활성</option>
          <option value="rejected">반려</option>
          <option value="suspended">중지</option>
        </select>
      </section>

      <section style={S.layout}>
        <section style={S.leftPane}>
          <div style={S.listHead}>
            <div style={S.sectionTitle}>사용자 목록</div>
            <div style={S.sectionSub}>{filteredRows.length}명</div>
          </div>

          <div style={S.listWrap}>
            {filteredRows.length === 0 ? (
              <div style={S.emptyBox}>조회된 사용자가 없습니다.</div>
            ) : (
              filteredRows.map((row) => {
                const selectedRow = row.user_id === selectedUserId;
                return (
                  <button
                    key={row.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(row.user_id)}
                    style={{
                      ...S.userCard,
                      ...(selectedRow ? S.userCardActive : null),
                    }}
                  >
                    <div style={S.userCardTop}>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.userName}>{resolveDisplayName(row)}</div>
                        <div style={S.userSub}>{resolveSubTitle(row)}</div>
                      </div>

                      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                        <span style={{ ...S.badge, ...badgeStyle("dark") }}>
                          {roleLabel(row.role)}
                        </span>
                        <span style={{ ...S.badge, ...badgeStyle(statusKind(row.status)) }}>
                          {statusLabel(row.status)}
                        </span>
                      </div>
                    </div>

                    <div style={S.userMeta}>
                      <div>전화: {safe(row.phone, "-")}</div>
                      <div>이메일: {safe(row.email, "-")}</div>
                      <div>가입일: {fmtDate(row.created_at)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section style={S.rightPane}>
          {!selected ? (
            <div style={S.emptyBox}>왼쪽에서 사용자를 선택하십시오.</div>
          ) : (
            <>
              <div style={S.detailTop}>
                <div>
                  <div style={S.detailName}>{resolveDisplayName(selected)}</div>
                  <div style={S.detailSub}>user_id: {selected.user_id}</div>
                </div>

                <div style={S.badgeRow}>
                  <span style={{ ...S.badge, ...badgeStyle("dark") }}>{roleLabel(selected.role)}</span>
                  <span style={{ ...S.badge, ...badgeStyle(statusKind(selected.status)) }}>
                    {statusLabel(selected.status)}
                  </span>
                </div>
              </div>

              <div style={S.cardGrid}>
                <div style={S.card}>
                  <div style={S.cardTitle}>기본 정보</div>
                  <InfoRow label="이름" value={safe(selected.name, "-")} />
                  <InfoRow label="전화" value={safe(selected.phone, "-")} />
                  <InfoRow label="이메일" value={safe(selected.email, "-")} />
                  <InfoRow label="역할" value={roleLabel(selected.role)} />
                  <InfoRow label="상태" value={statusLabel(selected.status)} />
                  <InfoRow label="가입일" value={fmtDate(selected.created_at)} />
                  <InfoRow label="수정일" value={fmtDate(selected.updated_at)} />

                  <div style={{ marginTop: 12 }}>
                    <div style={S.smallLabel}>역할 변경</div>
                    <div style={S.actionRow}>
                      <ActionButton
                        label="농민"
                        onClick={() => handleRoleChange(selected, "farmer")}
                        disabled={acting || selected.role === "farmer"}
                        variant="ghost"
                      />
                      <ActionButton
                        label="업체"
                        onClick={() => handleRoleChange(selected, "vendor")}
                        disabled={acting || selected.role === "vendor"}
                        variant="ghost"
                      />
                      <ActionButton
                        label="바이어"
                        onClick={() => handleRoleChange(selected, "buyer")}
                        disabled={acting || selected.role === "buyer"}
                        variant="ghost"
                      />
                      <ActionButton
                        label="관리자"
                        onClick={() => handleRoleChange(selected, "admin")}
                        disabled={acting || selected.role === "admin"}
                        variant="ghost"
                      />
                    </div>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}>업체 정보</div>
                  <InfoRow label="vendor_id" value={safe(selected.vendor_id, "-")} />
                  <InfoRow label="업체명" value={safe(selected.vendor_company_name, "-")} />
                  <InfoRow label="승인상태" value={statusLabel(selected.vendor_approval_status)} />
                  <InfoRow label="플랜" value={planLabel(selected.plan_type)} />
                  <InfoRow label="제품 제한" value={String(selected.product_limit ?? "-")} />
                  <InfoRow label="부스 제한" value={String(selected.booth_limit ?? "-")} />

                  {selected.vendor_id ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={S.smallLabel}>업체 승인/플랜</div>
                      <div style={S.actionRow}>
                        <ActionButton
                          label="업체 승인"
                          onClick={() => handleVendorApprove(selected)}
                          disabled={acting}
                          variant="primary"
                        />
                        <ActionButton
                          label="무료"
                          onClick={() => handlePlanChange(selected, "free")}
                          disabled={acting || selected.plan_type === "free"}
                          variant="ghost"
                        />
                        <ActionButton
                          label="기본"
                          onClick={() => handlePlanChange(selected, "basic")}
                          disabled={acting || selected.plan_type === "basic"}
                          variant="ghost"
                        />
                        <ActionButton
                          label="프리미엄"
                          onClick={() => handlePlanChange(selected, "premium")}
                          disabled={acting || selected.plan_type === "premium"}
                          variant="ghost"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={S.infoMuted}>업체 정보 없음</div>
                  )}
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}>바이어 정보</div>
                  <InfoRow label="buyer_id" value={safe(selected.buyer_id, "-")} />
                  <InfoRow label="회사명" value={safe(selected.buyer_company_name, "-")} />
                  <InfoRow label="국가" value={safe(selected.buyer_country, "-")} />
                  <InfoRow label="언어" value={safe(selected.buyer_language, "-")} />
                  <InfoRow label="승인상태" value={statusLabel(selected.buyer_approval_status)} />
                  <InfoRow label="검증상태" value={statusLabel(selected.buyer_verification_status)} />

                  {selected.buyer_id ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={S.smallLabel}>바이어 승인</div>
                      <div style={S.actionRow}>
                        <ActionButton
                          label="바이어 승인"
                          onClick={() => handleBuyerApprove(selected)}
                          disabled={acting}
                          variant="primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={S.infoMuted}>바이어 정보 없음</div>
                  )}
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}>농민 정보</div>
                  <InfoRow label="farmer_id" value={safe(selected.farmer_id, "-")} />
                  <InfoRow label="농장명" value={safe(selected.farm_name, "-")} />
                  <InfoRow label="지역" value={safe(selected.region, "-")} />
                  <InfoRow label="작물" value={safe(selected.crops, "-")} />
                  <InfoRow label="농민상태" value={statusLabel(selected.farmer_status)} />

                  {selected.farmer_id ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={S.smallLabel}>농민 활성화</div>
                      <div style={S.actionRow}>
                        <ActionButton
                          label="농민 활성"
                          onClick={() => handleFarmerActivate(selected)}
                          disabled={acting}
                          variant="primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={S.infoMuted}>농민 정보 없음</div>
                  )}
                </div>
              </div>

              <div style={S.bottomBar}>
                <ActionButton
                  label="계정 중지"
                  onClick={() => handleSuspend(selected)}
                  disabled={acting}
                  variant="danger"
                />
                <ActionButton
                  label="승인 반려"
                  onClick={() => handleReject(selected)}
                  disabled={acting}
                  variant="ghost"
                />
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.infoRow}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "ghost" | "danger";
}) {
  const style =
    variant === "primary" ? S.btnPrimary : variant === "danger" ? S.btnDanger : S.btnGhost;

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...style, opacity: disabled ? 0.45 : 1 }}>
      {label}
    </button>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: 20,
    background: "#f8fafc",
    minHeight: "100vh",
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "#fff",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#93c5fd",
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 950,
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.86)",
    maxWidth: 860,
  },
  notice: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
  },
  error: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
  },
  filterBar: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) 180px 180px",
    gap: 12,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  select: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  layout: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "380px minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  leftPane: {
    borderRadius: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 10px 20px rgba(15,23,42,0.03)",
  },
  rightPane: {
    borderRadius: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 18,
    boxShadow: "0 10px 20px rgba(15,23,42,0.03)",
    minHeight: 400,
  },
  listHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  sectionSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },
  listWrap: {
    display: "grid",
    gap: 10,
    maxHeight: "72vh",
    overflowY: "auto",
    paddingRight: 4,
  },
  emptyBox: {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 16,
    color: "#64748b",
    lineHeight: 1.8,
  },
  userCard: {
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
  },
  userCardActive: {
    border: "1px solid #0f172a",
    boxShadow: "0 0 0 1px #0f172a inset",
    background: "#f8fafc",
  },
  userCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  userSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  userMeta: {
    marginTop: 10,
    display: "grid",
    gap: 4,
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.6,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  detailTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 14,
    flexWrap: "wrap",
    paddingBottom: 14,
    borderBottom: "1px solid #e5e7eb",
  },
  detailName: {
    fontSize: 28,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.2,
  },
  detailSub: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "#64748b",
    wordBreak: "break-all",
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  cardGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0, 1fr)",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "start",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 1.7,
    wordBreak: "break-word",
  },
  smallLabel: {
    marginBottom: 8,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
  },
  infoMuted: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  actionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  btnPrimary: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhost: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  btnDanger: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  bottomBar: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};