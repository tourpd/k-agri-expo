import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getCrop, getProblem, getSymptom, PROBLEMS, problemsByCrop } from "@/lib/problems/catalog";
import { findAnswerProducts, shopSearchUrl } from "@/lib/problems/products";
import ProblemInquiryForm from "@/components/problems/ProblemInquiryForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProblem(slug);
  return { title: p ? `${p.title} | K-Agri Expo` : "문제 해결 | K-Agri Expo" };
}

function toEmbed(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = getProblem(slug);
  if (!problem) notFound();

  const crop = getCrop(problem.crop);
  const products = await findAnswerProducts(problem, 5);
  const siblings = problemsByCrop(problem.crop).filter((p) => p.slug !== problem.slug).slice(0, 4);
  const embed = toEmbed(problem.videoUrl);

  return (
    <div style={S.wrap}>
      {/* 머리 */}
      <div style={S.crumbs}>
        <Link href="/expo" style={S.crumb}>홈</Link>
        <span style={S.crumbSep}>›</span>
        {crop && crop.key !== "common" ? (
          <>
            <Link href={`/crop/${crop.key}`} style={S.crumb}>{crop.icon} {crop.label}</Link>
            <span style={S.crumbSep}>›</span>
          </>
        ) : null}
        <span style={S.crumbNow}>{problem.title}</span>
      </div>

      <h1 style={S.title}>{problem.title}</h1>
      <p style={S.summary}>{problem.summary}</p>
      <div style={S.tags}>
        {problem.symptoms.map((k) => {
          const s = getSymptom(k);
          return s ? (
            <Link key={k} href={`/symptom/${k}`} style={S.tag}>{s.icon} {s.label}</Link>
          ) : null;
        })}
        {problem.seasonal ? <span style={S.tagHot}>지금 시기</span> : null}
      </div>

      {/* 원인 · 할 일 */}
      <section style={S.card}>
        <div style={S.label}>원인</div>
        <p style={S.text}>{problem.cause}</p>
        <div style={{ ...S.label, marginTop: 16 }}>지금 할 일</div>
        <ol style={S.actions}>
          {problem.actions.map((a, i) => (
            <li key={i} style={S.action}>{a}</li>
          ))}
        </ol>
      </section>

      {/* 영상 */}
      {embed ? (
        <section style={S.card}>
          <div style={S.label}>관련 강의</div>
          <div style={S.video}>
            <iframe src={embed} title={problem.title} allowFullScreen style={S.iframe} />
          </div>
        </section>
      ) : null}

      {/* 해답 제품 */}
      <section style={S.card} id="answers">
        <div style={S.label}>해답</div>
        <p style={S.principle}>{problem.principle}</p>

        {problem.noProducts ? (
          <div style={S.noProduct}>
            <div style={S.noProductTitle}>이 증상은 원인이 여러 가지라 제품을 바로 권하지 않습니다.</div>
            <div style={S.noProductText}>사진으로 진단하거나 아래에 문의를 남기면 원인을 먼저 가려 드립니다.</div>
            <a href="/ai-consult" style={S.btnDark}>📷 사진으로 진단하기</a>
          </div>
        ) : products.length > 0 ? (
          <div style={S.products}>
            {products.map((p, i) => (
              <div key={p.id} style={S.product}>
                <div style={S.productTop}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} style={S.productImg} />
                  ) : (
                    <div style={S.productImgEmpty}>사진 준비 중</div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={S.productBrand}>{p.sponsored ? "후원 · " : ""}{p.brandName ?? "참여 기업"}</div>
                    <div style={S.productName}>{p.name}</div>
                    {p.shortDescription ? <div style={S.productDesc}>{p.shortDescription}</div> : null}
                    <div style={S.productPrice}>
                      {p.priceKrw ? `${p.priceKrw.toLocaleString("ko-KR")}원` : "가격 문의"}
                    </div>
                  </div>
                </div>
                <div style={S.productBtns}>
                  <a href={shopSearchUrl(p.name)} target="_blank" rel="noreferrer" style={S.btnBuy}>쇼핑몰에서 구매</a>
                  <Link href={p.href} style={S.btnGhost}>자세히</Link>
                  <a href={`#ask-${i}`} style={S.btnGhost}>기업에 묻기</a>
                </div>
                <details id={`ask-${i}`} style={S.details}>
                  <summary style={S.summaryBtn}>이 제품으로 문의하기</summary>
                  <div style={{ marginTop: 10 }}>
                    <ProblemInquiryForm
                      problemSlug={problem.slug}
                      problemTitle={problem.title}
                      productName={p.name}
                      boothId={p.boothId}
                      needsCrop={problem.crop === "common"}
                      compact
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <div style={S.noProduct}>
            <div style={S.noProductTitle}>이 문제의 해답 제품을 준비하고 있습니다.</div>
            <div style={S.noProductText}>아래에 문의를 남기면 맞는 기업을 연결해 드립니다.</div>
          </div>
        )}

        <div style={S.pesticideNote}>
          농약은 온라인 판매가 되지 않습니다. 가까운 판매점 안내:{" "}
          <a href="tel:010-8216-1253" style={S.link}>010-8216-1253</a>
        </div>
      </section>

      {/* 문의 */}
      <section id="ask">
        <ProblemInquiryForm
          problemSlug={problem.slug}
          problemTitle={problem.title}
          needsCrop={problem.crop === "common"}
        />
      </section>

      {/* 같은 작물 다른 문제 */}
      {siblings.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <div style={S.label}>{crop && crop.key !== "common" ? `${crop.label}의 다른 문제` : "다른 문제"}</div>
          <div style={S.siblings}>
            {siblings.map((p) => (
              <Link key={p.slug} href={`/p/${p.slug}`} style={S.sibling}>
                <div style={S.siblingTitle}>{p.title}</div>
                <div style={S.siblingSummary}>{p.summary}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div style={S.foot}>
        문제 {PROBLEMS.length}개 중 하나입니다 · <Link href="/symptom" style={S.link}>증상으로 찾기</Link> ·{" "}
        <Link href="/expo/deals" style={S.link}>지금 특가</Link>
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
  title: { marginTop: 10, fontSize: 30, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5, wordBreak: "keep-all", lineHeight: 1.2 },
  summary: { marginTop: 8, fontSize: 16, lineHeight: 1.65, color: "#334155", wordBreak: "keep-all" },
  tags: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  tag: { fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 999, background: "#f1f5f9", color: "#334155", textDecoration: "none" },
  tagHot: { fontSize: 12, fontWeight: 900, padding: "5px 10px", borderRadius: 999, background: "#fef3c7", color: "#92400e" },
  card: { marginTop: 18, padding: "18px 16px", borderRadius: 20, background: "#fff", border: "1px solid #e5e7eb" },
  label: { fontSize: 12, fontWeight: 950, color: "#16a34a", letterSpacing: 0.6 },
  text: { marginTop: 8, fontSize: 15, lineHeight: 1.7, color: "#1e293b", wordBreak: "keep-all" },
  actions: { marginTop: 8, paddingLeft: 22, display: "grid", gap: 8, listStyle: "decimal" },
  action: { fontSize: 15, lineHeight: 1.65, color: "#1e293b", wordBreak: "keep-all" },
  video: { marginTop: 10, position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000" },
  iframe: { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 },
  principle: { marginTop: 8, fontSize: 15, lineHeight: 1.7, color: "#1e293b", fontWeight: 700, wordBreak: "keep-all" },
  products: { marginTop: 12, display: "grid", gap: 12 },
  product: { padding: 14, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc" },
  productTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  productImg: { width: 84, height: 84, borderRadius: 12, objectFit: "cover", background: "#fff", flexShrink: 0 },
  productImgEmpty: { width: 84, height: 84, borderRadius: 12, background: "#e2e8f0", color: "#94a3b8", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  productBrand: { fontSize: 12, fontWeight: 800, color: "#16a34a" },
  productName: { marginTop: 2, fontSize: 17, fontWeight: 950, color: "#0f172a", wordBreak: "keep-all" },
  productDesc: { marginTop: 4, fontSize: 13, lineHeight: 1.5, color: "#475569", wordBreak: "keep-all" },
  productPrice: { marginTop: 6, fontSize: 16, fontWeight: 900, color: "#0f172a" },
  productBtns: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  btnBuy: { padding: "10px 14px", borderRadius: 12, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 14, textDecoration: "none" },
  btnGhost: { padding: "10px 12px", borderRadius: 12, background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 800, fontSize: 14, textDecoration: "none" },
  btnDark: { display: "inline-block", marginTop: 10, padding: "12px 16px", borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 900, fontSize: 14, textDecoration: "none" },
  details: { marginTop: 8 },
  summaryBtn: { cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#166534" },
  noProduct: { marginTop: 12, padding: 14, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a" },
  noProductTitle: { fontSize: 15, fontWeight: 900, color: "#78350f", wordBreak: "keep-all" },
  noProductText: { marginTop: 4, fontSize: 13, color: "#92400e", lineHeight: 1.5 },
  pesticideNote: { marginTop: 14, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  link: { color: "#15803d", fontWeight: 800 },
  siblings: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 },
  sibling: { padding: 14, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none", color: "#0f172a" },
  siblingTitle: { fontSize: 15, fontWeight: 900, wordBreak: "keep-all" },
  siblingSummary: { marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.5, wordBreak: "keep-all" },
  foot: { marginTop: 28, fontSize: 13, color: "#64748b", textAlign: "center" },
};
