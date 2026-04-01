"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "farmer" | "buyer" | "vendor";

export default function ExpoOnboardingRolePage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [role, setRole] = useState<Role>("farmer");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveRoleAndGo() {
    setMsg(null);
    setBusy(true);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;

      if (!userId) {
        setMsg("로그인이 필요합니다. 먼저 로그인해 주십시오.");
        setBusy(false);
        return;
      }

      // ✅ 권장: profiles 테이블에 role 저장 (없으면 나중에 생성)
      // 현재 프로젝트에 profiles가 있으니 upsert로 저장만 해둡니다.
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) {
        // profiles 구조가 다를 수 있어서 안내만
        setMsg(`역할 저장 실패(테이블/컬럼 확인 필요): ${error.message}`);
        return;
      }

      // ✅ 역할별 이동
      if (role === "vendor") router.replace("/expo/admin"); // 임시: 업체는 admin/대시보드로
      else router.replace("/expo"); // 농민/바이어는 엑스포 메인으로
    } catch (e: any) {
      setMsg(`오류: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo</div>
            <h1 style={S.title}>역할 선택</h1>
            <div style={S.sub}>한 번만 선택하면, 그 역할에 맞는 혜택/기능으로 화면이 구성됩니다.</div>
          </div>

          <div style={S.headerActions}>
            <Link href="/expo" style={S.btnGhost}>
              엑스포 홈
            </Link>
          </div>
        </header>

        <section style={S.grid}>
          <button
            type="button"
            onClick={() => setRole("farmer")}
            style={{ ...S.card, ...(role === "farmer" ? S.cardActive : {}) }}
            disabled={busy}
          >
            <div style={S.cardTitle}>🌱 농민</div>
            <div style={S.cardDesc}>특가/상담/관심부스 저장, 지역/작물 기반 맞춤 추천</div>
          </button>

          <button
            type="button"
            onClick={() => setRole("buyer")}
            style={{ ...S.card, ...(role === "buyer" ? S.cardActive : {}) }}
            disabled={busy}
          >
            <div style={S.cardTitle}>🧾 바이어</div>
            <div style={S.cardDesc}>견적/대량구매 문의, 업체 비교, 상담 이력 관리</div>
          </button>

          <button
            type="button"
            onClick={() => setRole("vendor")}
            style={{ ...S.card, ...(role === "vendor" ? S.cardActive : {}) }}
            disabled={busy}
          >
            <div style={S.cardTitle}>🏢 업체</div>
            <div style={S.cardDesc}>부스/딜 등록, 리드(상담요청) 관리, 공지/자료 업로드</div>
          </button>
        </section>

        <div style={S.bottom}>
          <button type="button" onClick={saveRoleAndGo} style={S.btnPrimary} disabled={busy}>
            {busy ? "저장 중..." : "이 역할로 시작하기 →"}
          </button>

          {msg ? <div style={S.msg}>{msg}</div> : null}

          <div style={S.hint}>
            * 이후에 “역할 변경” 메뉴를 만들 수 있습니다. (관리자 승인 필요한 역할: 업체)
          </div>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", padding: "26px 16px", color: "#111" },
  container: { maxWidth: 980, margin: "0 auto" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  kicker: { fontSize: 12, fontWeight: 900, color: "#666" },
  title: { margin: "6px 0 0", fontSize: 30, fontWeight: 950, letterSpacing: -0.2 },
  sub: { marginTop: 8, color: "#666", fontSize: 13, lineHeight: 1.7, maxWidth: 680 },
  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  grid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 12,
  },
  card: {
    textAlign: "left",
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 16,
    background: "#fafafa",
    cursor: "pointer",
  },
  cardActive: { border: "1px solid #111", background: "#fff" },
  cardTitle: { fontSize: 16, fontWeight: 950 },
  cardDesc: { marginTop: 10, fontSize: 13, color: "#555", lineHeight: 1.7 },

  bottom: { marginTop: 16, paddingTop: 12, borderTop: "1px solid #eee" },
  btnPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },
  msg: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fafafa",
    color: "#111",
    lineHeight: 1.7,
    fontSize: 13,
    whiteSpace: "pre-wrap",
  },
  hint: { marginTop: 10, fontSize: 12, color: "#777", lineHeight: 1.7 },
};