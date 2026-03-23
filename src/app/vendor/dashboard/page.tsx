"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  submitVendorDocs,
  fetchMyDocs,
  getSignedDocUrl,
  VendorDocRowSafe,
} from "../uploadDoc";

export const dynamic = "force-dynamic";

export default function VendorDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // vendors row 존재 여부 = 활성 업체(승인 완료 업체)
  const [isActiveVendor, setIsActiveVendor] = useState(false);

  // 업체 서류 입력값
  const [bizType, setBizType] = useState<"individual" | "corporation">(
    "individual"
  );
  const [companyName, setCompanyName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [bizNo, setBizNo] = useState("");

  const [bizFile, setBizFile] = useState<File | null>(null);
  const [corpFile, setCorpFile] = useState<File | null>(null);

  const [docs, setDocs] = useState<VendorDocRowSafe[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("auth.getUser error:", error);
          router.replace("/login/vendor");
          return;
        }

        const u = data.user;

        if (!u) {
          router.replace("/login/vendor");
          return;
        }

        setUserId(u.id);
        setEmail(u.email ?? null);

        await refreshAll(u.id);
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll(uid?: string) {
    const vuid = uid ?? userId;
    if (!vuid) return;

    // 1) 내 제출 서류 갱신
    const myDocs = await fetchMyDocs(supabase, vuid);
    setDocs(myDocs);

    // 2) vendors row 존재 여부 확인 = 승인 완료 업체 판단
    const { data: vRow, error: vErr } = await supabase
      .from("vendors")
      .select("user_id")
      .eq("user_id", vuid)
      .maybeSingle();

    if (vErr) {
      console.error("vendors check error:", vErr);
      setIsActiveVendor(false);
      return;
    }

    setIsActiveVendor(Boolean(vRow?.user_id));
  }

  async function handleSubmitDocs() {
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!companyName.trim()) {
      alert("상호(회사명)를 입력해 주세요.");
      return;
    }

    if (!ceoName.trim()) {
      alert("대표자명을 입력해 주세요.");
      return;
    }

    if (!bizNo.trim()) {
      alert("사업자번호를 입력해 주세요.");
      return;
    }

    if (!bizFile) {
      alert("사업자등록증(필수)을 업로드해 주세요.");
      return;
    }

    if (bizType === "corporation" && !corpFile) {
      alert("법인사업자라면 법인등기 파일도 업로드해 주세요.");
      return;
    }

    setLoading(true);

    try {
      await submitVendorDocs({
        supabase,
        userId,
        bizType,
        companyName,
        ceoName,
        bizNo,
        bizFile,
        corpFile: bizType === "corporation" ? corpFile : null,
      });

      await refreshAll();

      alert("인증 서류 제출이 완료되었습니다. 현재 심사 대기 상태입니다.");
    } catch (e: any) {
      console.error(e);
      alert(`제출 실패: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview(filePath: string) {
    try {
      const url = await getSignedDocUrl(supabase, filePath);
      window.open(url, "_blank");
    } catch (e: any) {
      console.error(e);
      alert(`미리보기 실패: ${e?.message ?? String(e)}`);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`로그아웃 실패: ${error.message}`);
      return;
    }

    router.replace("/login/vendor");
  }

  // docs 기준 승인 여부(보조 판단)
  const verifiedByDoc = useMemo(
    () =>
      docs.some(
        (d) => d.doc_type === "business_license" && d.status === "approved"
      ),
    [docs]
  );

  // 최종 승인 여부
  const verified = isActiveVendor || verifiedByDoc;

  if (booting) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <div style={S.loadingCard}>업체 대시보드 불러오는 중...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        {/* 헤더 */}
        <section style={S.hero}>
          <div>
            <div style={S.kicker}>VENDOR DASHBOARD</div>
            <h1 style={S.title}>업체 대시보드</h1>
            <div style={S.desc}>
              여기서 업체 인증, 부스 운영, 제품/특가 등록 준비를 진행합니다.
            </div>

            <div style={S.badges}>
              <span style={S.badge}>user_id: {userId ?? "-"}</span>
              <span style={S.badge}>email: {email ?? "-"}</span>
              <span
                style={{
                  ...S.badge,
                  ...(verified ? S.badgeOk : S.badgeWait),
                }}
              >
                인증상태: {verified ? "✅ 승인(활성 업체)" : "⏳ 미인증/심사중"}
              </span>
            </div>
          </div>

          <div style={S.heroActions}>
            <button onClick={() => refreshAll()} style={S.ghostBtn}>
              새로고침
            </button>
            <button onClick={handleLogout} style={S.darkBtn}>
              로그아웃
            </button>
          </div>
        </section>

        {/* 사업자 인증 */}
        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <h2 style={S.sectionTitle}>사업자 인증</h2>
              <div style={S.sectionSub}>
                업체 신뢰도와 공개 운영 기능을 위한 인증 단계입니다.
              </div>
            </div>

            <span
              style={{
                ...S.statusPill,
                ...(verified ? S.statusOk : S.statusWait),
              }}
            >
              {verified ? "🟢 승인 완료" : "🟡 심사 전/심사중"}
            </span>
          </div>

          {!verified ? (
            <>
              <div style={S.formGrid}>
                <div>
                  <label style={S.label}>사업자 유형</label>
                  <select
                    value={bizType}
                    onChange={(e) =>
                      setBizType(
                        e.target.value as "individual" | "corporation"
                      )
                    }
                    style={S.input}
                  >
                    <option value="individual">개인사업자</option>
                    <option value="corporation">법인사업자</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>상호(회사명)</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="예) 한국농수산TV"
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>대표자명</label>
                  <input
                    value={ceoName}
                    onChange={(e) => setCeoName(e.target.value)}
                    placeholder="예) 조세환"
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>사업자번호</label>
                  <input
                    value={bizNo}
                    onChange={(e) => setBizNo(e.target.value)}
                    placeholder="예) 123-45-67890"
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>사업자등록증(필수)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
                    style={S.fileInput}
                  />
                  <div style={S.help}>이미지 또는 PDF 권장</div>
                </div>

                <div>
                  <label style={S.label}>법인등기(법인일 때)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={bizType !== "corporation"}
                    onChange={(e) => setCorpFile(e.target.files?.[0] ?? null)}
                    style={S.fileInput}
                  />
                  <div style={S.help}>법인사업자면 추가 제출 권장</div>
                </div>
              </div>

              <div style={S.actionRow}>
                <button
                  onClick={handleSubmitDocs}
                  disabled={loading}
                  style={S.primaryBtn}
                >
                  {loading ? "제출 중..." : "인증 서류 제출"}
                </button>

                <div style={S.note}>
                  승인 전에는 기본 정보 준비만 가능하고, 공개 운영·LIVE 특판·바이어
                  전용 기능은 승인 후 여는 구조를 권장합니다.
                </div>
              </div>
            </>
          ) : (
            <div style={S.successBox}>
              ✅ 승인 완료되었습니다. 이제 부스 운영과 제품/특가 관리 기능을 사용할
              수 있습니다.
            </div>
          )}
        </section>

        {/* 내 제출 내역 */}
        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <h2 style={S.sectionTitle}>내 제출 내역</h2>
              <div style={S.sectionSub}>제출한 인증 서류와 상태를 확인합니다.</div>
            </div>
          </div>

          {docs.length === 0 ? (
            <div style={S.emptyBox}>아직 제출한 서류가 없습니다.</div>
          ) : (
            <div style={S.docList}>
              {docs.map((d) => (
                <div key={d.id} style={S.docItem}>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.docTitle}>
                      {d.doc_type === "business_license"
                        ? "사업자등록증"
                        : "법인등기"}
                      <span style={S.docStatus}>({d.status})</span>
                    </div>

                    <div style={S.docPath}>{d.file_path}</div>

                    {d.status === "rejected" && d.reject_reason ? (
                      <div style={S.rejectReason}>
                        반려사유: {d.reject_reason}
                      </div>
                    ) : null}
                  </div>

                  <div style={S.docActions}>
                    <button
                      onClick={() => handlePreview(d.file_path)}
                      style={S.ghostBtn}
                    >
                      보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 다음 단계 */}
        <section style={S.card}>
          <div style={S.sectionTop}>
            <div>
              <h2 style={S.sectionTitle}>부스/제품 운영</h2>
              <div style={S.sectionSub}>
                승인 이후 부스, 제품, 특가, 자료 등록 흐름으로 넘어갑니다.
              </div>
            </div>
          </div>

          {!verified ? (
            <div style={S.waitBox}>
              ⏳ 현재는 심사중입니다. 승인 후 부스 공개 운영 기능을 여는 구조로 가는
              것이 안전합니다.
            </div>
          ) : (
            <div style={S.actionRow}>
              <button
                onClick={() => router.push("/vendor/booth")}
                style={S.primaryBtn}
              >
                부스 관리로 이동
              </button>

              <button
                onClick={() => router.push("/vendor/inquiries")}
                style={S.primaryBtn}
              >
                상담 요청 관리
              </button>

              <button
                onClick={() => router.push("/vendor/dashboard")}
                style={S.ghostBtn}
              >
                대시보드로 이동
              </button>

              <div style={S.note}>
                제품 등록 구조와 공개 노출 연결, 바이어 문의 응대는 다음 단계에서 이어
                붙이면 됩니다.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  },

  loadingCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    padding: 24,
    borderRadius: 28,
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#93c5fd",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 38,
    fontWeight: 950,
    letterSpacing: -0.6,
  },
  desc: {
    marginTop: 12,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.8,
  },
  badges: {
    marginTop: 18,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 900,
  },
  badgeOk: {
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.28)",
  },
  badgeWait: {
    background: "rgba(251,191,36,0.16)",
    border: "1px solid rgba(251,191,36,0.26)",
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  card: {
    marginTop: 18,
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    background: "#fff",
    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  },

  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
    color: "#0f172a",
  },
  sectionSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },

  statusPill: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid #eee",
  },
  statusOk: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  statusWait: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fdba74",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 8,
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    fontSize: 14,
    background: "#fff",
  },

  fileInput: {
    width: "100%",
    padding: "10px 0",
    fontSize: 14,
  },

  help: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.6,
  },

  actionRow: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  ghostBtn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  },

  darkBtn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  note: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.7,
  },

  successBox: {
    padding: 14,
    borderRadius: 16,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    lineHeight: 1.8,
    fontWeight: 800,
  },

  emptyBox: {
    padding: 14,
    borderRadius: 16,
    background: "#f8fafc",
    color: "#64748b",
    lineHeight: 1.7,
  },

  docList: {
    display: "grid",
    gap: 10,
  },

  docItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  docTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: "#0f172a",
  },

  docStatus: {
    marginLeft: 8,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
  },

  docPath: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.6,
    wordBreak: "break-all",
  },

  rejectReason: {
    marginTop: 6,
    fontSize: 12,
    color: "#b91c1c",
    lineHeight: 1.6,
  },

  docActions: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },

  waitBox: {
    padding: 14,
    borderRadius: 16,
    border: "1px solid #fdba74",
    background: "#fff7ed",
    color: "#9a3412",
    lineHeight: 1.8,
    fontWeight: 800,
  },
};