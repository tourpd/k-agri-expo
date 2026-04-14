import React from "react";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ExpoAdminIndexPage() {
  await requireAdminUser();

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.headerTopRow}>
          <div style={S.header}>
            <div style={S.kicker}>K-Agri Expo Admin</div>
            <h1 style={S.title}>운영 대시보드</h1>
            <div style={S.desc}>
              메인 편성, 농민 고민 카드, 경품 추첨, 전시장 운영, 참가 업체 관리, 입점 신청 검토를
              여기서 진행합니다.
            </div>
          </div>

          <div style={S.headerActions}>
            <Link href="/expo" style={S.ghostBtn}>
              박람회 메인 보기
            </Link>
            <AdminLogoutButton />
          </div>
        </div>

        <div style={S.sectionLabel}>콘텐츠 / 편성 운영</div>
        <div style={S.grid}>
          <Link href="/expo/admin/home-slots" style={S.card}>
            <div style={S.cardBadge}>HOME</div>
            <div style={S.cardTitle}>메인페이지 편성실</div>
            <div style={S.cardDesc}>
              메인 배너, 이달의 핫 이슈, 메인 경품, 현장 특가, 라이브쇼 등 메인페이지 핵심 영역을
              편성합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo/admin/problem-cards" style={S.card}>
            <div style={S.cardBadge}>PROBLEM</div>
            <div style={S.cardTitle}>농민 고민 해결 카드 편성실</div>
            <div style={S.cardDesc}>
              월별·작물별·시즌별 농민 고민 해결 카드의 제목, 요약, 링크, 노출 월, 우선순위를
              관리합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo/admin/feature-slots" style={S.card}>
            <div style={S.cardBadge}>FEATURE</div>
            <div style={S.cardTitle}>전시장 편성실</div>
            <div style={S.cardDesc}>
              메인 슬라이드, 관별 TOP 노출, 카테고리 이동 동선, 추천 부스와 주요 진입 구조를
              관리합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo/admin/draw" style={S.card}>
            <div style={S.cardBadge}>DRAW</div>
            <div style={S.cardTitle}>메인 경품 랜덤 추첨</div>
            <div style={S.cardDesc}>
              이벤트 참여자를 확인하고 라이브 방송용 랜덤 추첨, 당첨자 확인, 재추첨 흐름을
              운영합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>
        </div>

        <div style={S.sectionLabel}>업체 / 판매 운영</div>
        <div style={S.grid}>
          <Link href="/expo/admin/vendor-applications" style={S.card}>
            <div style={S.cardBadge}>VENDOR</div>
            <div style={S.cardTitle}>업체 입점 신청 검토</div>
            <div style={S.cardDesc}>
              사업자등록증 업로드 신청서를 검토하고 승인 또는 반려 처리합니다. 승인 시 vendors와
              booths를 자동 생성하는 운영의 시작점입니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo/deals" style={S.card}>
            <div style={S.cardBadge}>DEALS</div>
            <div style={S.cardTitle}>EXPO 특가 실노출 점검</div>
            <div style={S.cardDesc}>
              현재 실제 노출 중인 EXPO 특가 목록을 사용자 화면 기준으로 확인하고, 판매 흐름과
              연결 상태를 점검합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo/booths" style={S.card}>
            <div style={S.cardBadge}>BOOTHS</div>
            <div style={S.cardTitle}>참가 부스 실노출 점검</div>
            <div style={S.cardDesc}>
              참가기업 부스 목록, 카테고리별 진입 구조, 공개 부스 페이지 상태를 실제 사용자 화면에서
              확인합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>

          <Link href="/expo" style={S.card}>
            <div style={S.cardBadge}>EXPO</div>
            <div style={S.cardTitle}>박람회 메인 보기</div>
            <div style={S.cardDesc}>
              실제 사용자 화면에서 현재 편성 상태, 핫 이슈, 상담 영역, 경품/라이브 흐름을 바로
              확인합니다.
            </div>
            <div style={S.cardCta}>바로 가기 →</div>
          </Link>
        </div>

        <div style={S.quickBox}>
          <div style={S.quickTitle}>빠른 운영 링크</div>
          <div style={S.quickLinks}>
            <Link href="/expo/admin/home-slots" style={S.quickLink}>
              메인 편성실
            </Link>
            <Link href="/expo/admin/problem-cards" style={S.quickLink}>
              고민 해결 카드 편성
            </Link>
            <Link href="/expo/event" style={S.quickLink}>
              이벤트 참여 페이지
            </Link>
            <Link href="/expo/live" style={S.quickLink}>
              라이브 안내 페이지
            </Link>
            <Link href="/expo/booths" style={S.quickLink}>
              참가 부스 목록
            </Link>
            <Link href="/expo/deals" style={S.quickLink}>
              EXPO 특가 목록
            </Link>
            <Link href="/expo/admin/vendor-applications" style={S.quickLink}>
              업체 입점 신청 검토
            </Link>
          </div>
        </div>
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
    maxWidth: 1360,
    margin: "0 auto",
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 22,
  },
  header: {
    flex: 1,
    minWidth: 320,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  ghostBtn: {
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    letterSpacing: -0.8,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
    fontSize: 15,
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  card: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
  },
  cardBadge: {
    display: "inline-block",
    alignSelf: "flex-start",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#f1f5f9",
    fontSize: 11,
    fontWeight: 950,
    color: "#0f172a",
  },
  cardTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1.15,
    letterSpacing: -0.4,
  },
  cardDesc: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
    flex: 1,
  },
  cardCta: {
    marginTop: 18,
    fontWeight: 950,
    fontSize: 14,
  },
  quickBox: {
    marginTop: 24,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  quickTitle: {
    fontSize: 20,
    fontWeight: 950,
    marginBottom: 12,
    color: "#0f172a",
  },
  quickLinks: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  quickLink: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    fontSize: 14,
  },
};