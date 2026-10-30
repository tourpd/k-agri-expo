import Link from "next/link";
import type { CSSProperties } from "react";
import { PROBLEMS, getCrop } from "@/lib/problems/catalog";
import ProductRegisterForm from "@/components/register/ProductRegisterForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "기업 제품 등록 | K-Agri Expo" };

/**
 * 기업 입구 — 로그인 없이 제품을 올리고, 승인되면 농민 문제 페이지·계산기에 노출.
 * 농민 문의·전화는 기업에 직접 갑니다. 운영자는 승인만.
 */
export default function RegisterPage() {
  const problems = PROBLEMS.filter((p) => !p.noProducts).map((p) => ({
    slug: p.slug,
    title: p.title,
    cropLabel: p.crop === "common" ? "공통(시설·토양)" : getCrop(p.crop)?.label ?? p.crop,
  }));

  return (
    <div style={S.wrap}>
      <div style={S.kicker}>기업·판매자용</div>
      <h1 style={S.title}>농민이 찾는 자리에 제품을 올리세요</h1>
      <p style={S.sub}>
        농민은 "딸기에 응애", "600평이면 몇 병" 하고 들어옵니다. 제품과 <b>사용량</b>만 등록하면 그 문제 페이지와 살포량 계산기에 귀사 제품이 뜨고, 전화·문의가 귀사로 바로 갑니다. 등록은 무료, 노출은 운영자 승인 후.
      </p>
      <div style={S.steps}>
        <div style={S.step}><b>1</b> 아래 양식 제출 (5분)</div>
        <div style={S.step}><b>2</b> 운영자 확인 (1~2일)</div>
        <div style={S.step}><b>3</b> 문제 페이지·계산기 노출, 농민 전화 직통</div>
      </div>
      <ProductRegisterForm problems={problems} />
      <div style={S.foot}>
        부스(전시관) 입점·후원 자리는 <Link href="/vendor/apply" style={S.link}>입점 신청</Link>에서. 농약은 등록된 안전사용기준대로만 표시되며 온라인 판매 버튼이 붙지 않습니다.
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 720, margin: "0 auto" },
  kicker: { fontSize: 12, fontWeight: 900, color: "#16a34a" },
  title: { marginTop: 4, fontSize: 26, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5, wordBreak: "keep-all", lineHeight: 1.25 },
  sub: { marginTop: 8, fontSize: 15, lineHeight: 1.65, color: "#334155", wordBreak: "keep-all" },
  steps: { marginTop: 12, display: "grid", gap: 6 },
  step: { padding: "10px 12px", borderRadius: 12, background: "#f0fdf4", color: "#14532d", fontSize: 14, fontWeight: 700 },
  foot: { marginTop: 20, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  link: { color: "#15803d", fontWeight: 800 },
};
