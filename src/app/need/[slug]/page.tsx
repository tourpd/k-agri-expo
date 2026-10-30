import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getCrop, getProblem } from "@/lib/problems/catalog";
import { getNeed, NEED_CATEGORY_LABEL, NEEDS } from "@/lib/problems/needs";
import { findProductsByKeywords, shopSearchUrl } from "@/lib/problems/products";
import ProblemInquiryForm from "@/components/problems/ProblemInquiryForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const need = getNeed(slug);
  if (!need) notFound();

  const cat = NEED_CATEGORY_LABEL[need.category];
  const products = await findProductsByKeywords(need.productKeywords, 4, need.productKeywords);
  const related = need.relatedProblems.map(getProblem).filter(Boolean);
  // 준비물 문의는 연결된 첫 문제 페이지 이름으로 접수 (문의 표는 하나)
  const inquirySlug = need.relatedProblems[0] ?? "greenhouse-heating-prep";

  return (
    <div style={S.wrap}>
      <div style={S.crumbs}>
        <Link href="/expo" style={S.crumb}>홈</Link>
        <span style={S.crumbSep}>›</span>
        <Link href="/need" style={S.crumb}>이달의 준비물</Link>
        <span style={S.crumbSep}>›</span>
        <span style={S.crumbNow}>{need.title}</span>
      </div>

      <div style={S.catTag}>{cat.icon} {cat.label}</div>
      <h1 style={S.title}>{need.title}</h1>
      <p style={S.why}>{need.why}</p>
      <div style={S.crops}>
        {need.crops.map((k) => {
          const c = getCrop(k);
          return c ? <Link key={k} href={`/crop/${k}`} style={S.cropChip}>{c.icon} {c.label}</Link> : null;
        })}
      </div>

      <section style={S.card}>
        <div style={S.label}>고를 때 볼 것</div>
        <ol style={S.list}>
          {need.checklist.map((t, i) => <li key={i} style={S.item}>{t}</li>)}
        </ol>
      </section>

      <section style={S.card}>
        <div style={S.label}>참여 기업 제품</div>
        {products.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyTitle}>이 준비물을 다루는 기업을 모으고 있습니다.</div>
            <div style={S.emptyText}>아래에 문의를 남기면 맞는 기업을 연결해 드립니다. 기업이시면 <Link href="/vendor/apply" style={S.link}>입점 신청</Link>으로.</div>
          </div>
        ) : (
          <div style={S.products}>
            {products.map((p) => (
              <div key={p.id} style={S.product}>
                <div style={S.productBrand}>{p.brandName ?? "참여 기업"}</div>
                <div style={S.productName}>{p.name}</div>
                {p.shortDescription ? <div style={S.productDesc}>{p.shortDescription}</div> : null}
                <div style={S.productPrice}>{p.priceKrw ? `${p.priceKrw.toLocaleString("ko-KR")}원` : "가격 문의"}</div>
                <div style={S.btns}>
                  <a href={shopSearchUrl(p.name)} target="_blank" rel="noreferrer" style={S.btnBuy}>쇼핑몰에서 구매</a>
                  <Link href={p.href} style={S.btnGhost}>자세히</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ProblemInquiryForm problemSlug={inquirySlug} problemTitle={need.title} productName={need.title} />

      {related.length > 0 ? (
        <section style={{ marginTop: 22 }}>
          <div style={S.label}>관련 문제</div>
          <div style={S.relGrid}>
            {related.map((p) => p ? (
              <Link key={p.slug} href={`/p/${p.slug}`} style={S.rel}>
                <div style={S.relTitle}>{p.title}</div>
                <div style={S.relSummary}>{p.summary}</div>
              </Link>
            ) : null)}
          </div>
        </section>
      ) : null}

      <div style={S.foot}>
        <Link href="/need" style={S.link}>이달의 준비물 {NEEDS.length}개 전체 보기</Link>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 40px", maxWidth: 820, margin: "0 auto" },
  crumbs: { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "#64748b", flexWrap: "wrap" },
  crumb: { color: "#64748b", textDecoration: "none" },
  crumbSep: { color: "#cbd5e1" },
  crumbNow: { color: "#0f172a", fontWeight: 700 },
  catTag: { marginTop: 12, display: "inline-block", fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8" },
  title: { marginTop: 8, fontSize: 28, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5, wordBreak: "keep-all", lineHeight: 1.2 },
  why: { marginTop: 8, fontSize: 15, lineHeight: 1.65, color: "#334155", wordBreak: "keep-all" },
  crops: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  cropChip: { fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 999, background: "#f0fdf4", color: "#14532d", textDecoration: "none" },
  card: { marginTop: 18, padding: "18px 16px", borderRadius: 20, background: "#fff", border: "1px solid #e5e7eb" },
  label: { fontSize: 12, fontWeight: 950, color: "#1d4ed8", letterSpacing: 0.6 },
  list: { marginTop: 8, paddingLeft: 22, display: "grid", gap: 8, listStyle: "decimal" },
  item: { fontSize: 15, lineHeight: 1.65, color: "#1e293b", wordBreak: "keep-all" },
  empty: { marginTop: 10, padding: 14, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a" },
  emptyTitle: { fontSize: 15, fontWeight: 900, color: "#78350f" },
  emptyText: { marginTop: 4, fontSize: 13, color: "#92400e", lineHeight: 1.6 },
  products: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  product: { padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" },
  productBrand: { fontSize: 12, fontWeight: 800, color: "#1d4ed8" },
  productName: { marginTop: 2, fontSize: 16, fontWeight: 950, color: "#0f172a", wordBreak: "keep-all" },
  productDesc: { marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#475569", wordBreak: "keep-all" },
  productPrice: { marginTop: 6, fontSize: 15, fontWeight: 900, color: "#0f172a" },
  btns: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  btnBuy: { padding: "9px 12px", borderRadius: 10, background: "#1d4ed8", color: "#fff", fontWeight: 900, fontSize: 13, textDecoration: "none" },
  btnGhost: { padding: "9px 12px", borderRadius: 10, background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 800, fontSize: 13, textDecoration: "none" },
  relGrid: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 },
  rel: { padding: 14, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  relTitle: { fontSize: 15, fontWeight: 900, wordBreak: "keep-all" },
  relSummary: { marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  link: { color: "#1d4ed8", fontWeight: 800 },
  foot: { marginTop: 28, fontSize: 13, color: "#64748b", textAlign: "center" },
};
