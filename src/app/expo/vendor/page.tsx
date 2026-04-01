import React from "react";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type BoothSummary = {
  booth_id: string;
  name: string | null;
  category_primary: string | null;
  region: string | null;
  status: string | null;
  updated_at?: string | null;
};

export default async function ExpoVendorDashboardPage() {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <div style={S.errorCard}>
            <div style={S.eyebrow}>ACCESS DENIED</div>
            <h1 style={S.title}>접근 권한이 없습니다.</h1>
            <div style={S.desc}>관리자 또는 업체 계정으로 로그인 후 접근해 주세요.</div>
            <Link href="/expo" style={S.primaryBtn}>
              엑스포 홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = createSupabaseAdminClient();

  let booths: BoothSummary[] = [];
  try {
    const { data } = await supabase
      .from("booths")
      .select("booth_id,name,category_primary,region,status,updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);

    booths = (data ?? []) as BoothSummary[];
  } catch {
    booths = [];
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <section style={S.heroCard}>
          <div>
            <div style={S.eyebrow}>VENDOR DASHBOARD</div>
            <h1 style={S.title}>업체 운영 대시보드</h1>
            <div style={S.desc}>
              부스 정보, 제품, 영상, 카탈로그, 이벤트/홍보를 한곳에서 관리합니다.
            </div>
          </div>

          <div style={S.heroActions}>
            <Link href="/expo/admin" style={S.ghostBtn}>
              엑스포 관리자
            </Link>
            <Link href="/expo" style={S.primaryBtn}>
              엑스포 홈
            </Link>
          </div>
        </section>

        <section style={S.statsGrid}>
          <div style={S.statCard}>
            <div style={S.statLabel}>등록 부스</div>
            <div style={S.statValue}>{booths.length}개</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>운영 핵심</div>
            <div style={S.statValueSmall}>제품 · 영상 · 이벤트</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>다음 단계</div>
            <div style={S.statValueSmall}>노출 · 상담 · 판매</div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionEyebrow}>MANAGEMENT MENU</div>
              <h2 style={S.sectionTitle}>운영 메뉴</h2>
            </div>
          </div>

          <div style={S.menuGrid}>
            <Link href="/expo/vendor/booth-editor" style={S.menuCard}>
              <div style={S.menuIcon}>🏢</div>
              <div style={S.menuTitle}>부스 편집</div>
              <div style={S.menuDesc}>부스명, 소개, 연락처, 영상, 썸네일, 카탈로그 수정</div>
            </Link>

            <Link href="/expo/vendor/products" style={S.menuCard}>
              <div style={S.menuIcon}>📦</div>
              <div style={S.menuTitle}>제품 관리</div>
              <div style={S.menuDesc}>제품 등록, 설명 수정, 가격/특가 연결</div>
            </Link>

            <Link href="/expo/vendor/videos" style={S.menuCard}>
              <div style={S.menuIcon}>🎬</div>
              <div style={S.menuTitle}>영상 관리</div>
              <div style={S.menuDesc}>유튜브 링크 등록, 대표 영상 지정</div>
            </Link>

            <Link href="/expo/vendor/documents" style={S.menuCard}>
              <div style={S.menuIcon}>📄</div>
              <div style={S.menuTitle}>카탈로그 관리</div>
              <div style={S.menuDesc}>PDF, 제품 자료, 브로슈어 링크 관리</div>
            </Link>

            <Link href="/expo/vendor/promotions" style={S.menuCard}>
              <div style={S.menuIcon}>🔥</div>
              <div style={S.menuTitle}>이벤트/홍보 신청</div>
              <div style={S.menuDesc}>핫이슈, 메인 노출, 라이브쇼 경품/홍보 신청</div>
            </Link>

            <Link href="/expo/vendor/inquiries" style={S.menuCard}>
              <div style={S.menuIcon}>✍️</div>
              <div style={S.menuTitle}>문의 관리</div>
              <div style={S.menuDesc}>부스 문의, 상담 신청, 응대 현황 확인</div>
            </Link>

            <Link href="/expo/vendor/leads" style={S.menuCard}>
              <div style={S.menuIcon}>📈</div>
              <div style={S.menuTitle}>리드 관리</div>
              <div style={S.menuDesc}>특가/상담 유입 고객과 우선순위 관리</div>
            </Link>

            <Link href="/expo/vendor/orders" style={S.menuCard}>
              <div style={S.menuIcon}>💳</div>
              <div style={S.menuTitle}>주문/정산</div>
              <div style={S.menuDesc}>판매 현황, 수수료, 정산 예정 금액 확인</div>
            </Link>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionEyebrow}>MY BOOTHS</div>
              <h2 style={S.sectionTitle}>최근 부스</h2>
            </div>
          </div>

          {booths.length === 0 ? (
            <div style={S.emptyBox}>등록된 부스가 없습니다.</div>
          ) : (
            <div style={S.boothGrid}>
              {booths.map((booth) => (
                <div key={booth.booth_id} style={S.boothCard}>
                  <div style={S.boothTop}>
                    <div>
                      <div style={S.boothName}>{booth.name ?? "이름 없음"}</div>
                      <div style={S.boothMeta}>
                        {booth.region ?? "지역 미입력"} · {booth.category_primary ?? "카테고리 미입력"}
                      </div>
                    </div>
                    <div style={S.statusBadge}>{booth.status ?? "상태 미설정"}</div>
                  </div>

                  <div style={S.boothActions}>
                    <Link
                      href={`/expo/vendor/booth-editor?booth_id=${encodeURIComponent(booth.booth_id)}`}
                      style={S.smallPrimaryBtn}
                    >
                      부스 편집
                    </Link>

                    <Link
                      href={`/expo/booths/${encodeURIComponent(booth.booth_id)}`}
                      style={S.smallGhostBtn}
                    >
                      공개 페이지
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={S.tipCard}>
          <div style={S.sectionEyebrow}>OPERATING TIP</div>
          <h2 style={S.sectionTitle}>노출을 높이는 운영 순서</h2>
          <div style={S.tipList}>
            <div>1. 부스 소개와 대표 연락처를 먼저 채웁니다.</div>
            <div>2. 대표 제품 3개 이상을 등록합니다.</div>
            <div>3. 유튜브 영상 1개를 연결합니다.</div>
            <div>4. 카탈로그/PDF 자료를 넣습니다.</div>
            <div>5. 이벤트/홍보 신청으로 메인 노출을 요청합니다.</div>
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
    padding: 24,
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  errorCard: {
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
    maxWidth: 760,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#15803d",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 900,
  },
  statsGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
  },
  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  },
  statValueSmall: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  card: {
    marginTop: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  tipCard: {
    marginTop: 18,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
  },
  menuGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  menuCard: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    display: "block",
    minHeight: 156,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 900,
  },
  menuDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#64748b",
  },
  boothGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  boothCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
  },
  boothTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  boothName: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  boothMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },
  statusBadge: {
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 900,
  },
  boothActions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  smallPrimaryBtn: {
    textDecoration: "none",
    background: "#15803d",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 900,
  },
  smallGhostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 900,
  },
  emptyBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
  tipList: {
    marginTop: 14,
    display: "grid",
    gap: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#166534",
    fontWeight: 700,
  },
};