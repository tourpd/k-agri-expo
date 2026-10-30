import Link from "next/link";
import type { CSSProperties } from "react";
import { CROPS, getCrop, getProblem, type CropKey } from "@/lib/problems/catalog";
import { PARTNER_PRODUCTS, getPartnerProduct, partnerCompany, partnerProductsForCrop, searchPartnerProducts } from "@/lib/problems/partner-catalog";
import { buildBuyLinks } from "@/lib/shop/buy-links";
import CalcClient from "@/components/problems/CalcClient";
import StickyAsk from "@/components/problems/StickyAsk";
import { searchMaterials } from "@/lib/materials/organic";
import { SUBMISSION_PREFIX, searchSubmissions, submissionById, submissionToPartner } from "@/lib/submissions/products";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = { title: "약박사 — 내 밭엔 몇 병? | K-Agri Expo" };

type SP = Promise<{ p?: string; q?: string; crop?: string; area?: string; from?: string }>;

/**
 * 살포량 계산기
 *  /yakbaksa        → 제품 고르기 (검색 · 작물별)
 *  /yakbaksa?p=<id>     → 그 제품으로 "내 밭 ○평이면 몇 병, 물 몇 통, 한 통에 몇 ml"
 */
export default async function CalcPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  // 제품: 카탈로그(dof-…) 또는 기업 등록(s:…)
  let product = sp.p ? getPartnerProduct(sp.p) : null;
  let company: { name: string; phone: string } | null = product ? partnerCompany(product) : null;
  let buyUrl: string | null = null;
  if (!product && sp.p?.startsWith(SUBMISSION_PREFIX)) {
    const row = await submissionById(sp.p);
    if (row) {
      const conv = submissionToPartner(row);
      product = conv;
      company = { name: conv.companyName, phone: conv.companyPhone };
      buyUrl = conv.buyUrl;
    }
  }

  if (product && company) {
    const area = Math.max(1, Math.min(100000, parseInt(sp.area ?? "300", 10) || 300));
    const buyLinks = await buildBuyLinks({ name: product.name, companyName: company.name, phone: company.phone, sellable: product.sellable, keyword: `${company.name} ${product.name.replace(/-/g, "")}`, coupang: product.coupang });
    if (buyUrl) buyLinks.unshift({ label: `${company.name} 판매처에서 사기`, href: buyUrl, kind: "ours", sub: "기업 직영" });
    const fromProblem = sp.from ? getProblem(sp.from) : null;

    return (
      <div style={S.wrap}>
        <Link href={fromProblem ? `/p/${fromProblem.slug}` : "/yakbaksa"} style={S.back}>
          ‹ {fromProblem ? fromProblem.title : "약박사 — 다른 제품"}
        </Link>
        <div style={S.rowTop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/doctor-q-face.png" alt="닥터Q" width={44} height={44} style={S.face} />
          <div style={S.brand}>{company.name} · {product.group}{product.organicCertNo ? ` · ${product.organicCertNo}` : ""}</div>
        </div>
        <h1 style={S.title}>{product.name}</h1>
        <p style={S.feature}>{product.feature}</p>
        <div style={S.tags}>
          {product.uses.slice(0, 6).map((u) => (
            <span key={u} style={S.tag}>{u}</span>
          ))}
        </div>
        <div style={S.crops}>대상작물: {product.crops.join(" · ")}</div>

        <CalcClient product={product} companyName={company.name} initialArea={area} buyLinks={buyLinks} />

        <div style={{ height: 84 }} />
        <StickyAsk problemSlug={fromProblem?.slug ?? `product:${product.id}`} problemTitle={`${product.name} 문의`} phone={company.phone} companyName={company.name} needsCrop />
      </div>
    );
  }

  // 제품 고르기
  const q = (sp.q ?? "").trim();
  const cropKey = (sp.crop ?? "") as CropKey;
  const crop = cropKey ? getCrop(cropKey) : null;
  const list = q ? searchPartnerProducts(q, 30) : crop ? partnerProductsForCrop(crop.key) : PARTNER_PRODUCTS;
  const organic = q ? searchMaterials(q, undefined, 12) : [];
  const submitted = q ? (await searchSubmissions(q, 10)).map(submissionToPartner) : [];

  return (
    <div style={S.wrap}>
      <div style={S.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/doctor-q.jpg" alt="닥터Q" width={112} height={153} style={S.heroImg} />
        <div style={S.bubble}>
          <div style={S.brand}>약박사 · 닥터Q</div>
          <h1 style={S.title}>내 밭엔 몇 병? 한 통엔 몇 ml?</h1>
          <p style={S.feature}>제품 고르고 평수만 넣으세요. 몇 병 사야 하는지, 물 몇 통에 타는지, 언제 뿌리는지 바로 알려 드립니다. 숫자는 자료 그대로, 라벨이 우선입니다.</p>
        </div>
      </div>

      <form action="/yakbaksa" method="get" style={S.searchRow}>
        <input name="q" defaultValue={q} placeholder="제품 이름이나 증상 (예: 응애, 아미65)" style={S.search} />
        <button type="submit" style={S.searchBtn}>찾기</button>
      </form>

      <div style={S.chips}>
        <Link href="/yakbaksa" style={{ ...S.chip, ...(!crop && !q ? S.chipOn : {}) }}>전체</Link>
        {CROPS.filter((c) => c.key !== "common").map((c) => (
          <Link key={c.key} href={`/yakbaksa?crop=${c.key}`} style={{ ...S.chip, ...(crop?.key === c.key ? S.chipOn : {}) }}>
            {c.icon} {c.label}
          </Link>
        ))}
      </div>

      {submitted.length ? (
        <div style={S.list}>
          {submitted.map((p) => (
            <Link key={p.id} href={`/yakbaksa?p=${encodeURIComponent(p.id)}`} style={S.item}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.itemBrand}>{p.companyName} · {p.group}</div>
                <div style={S.itemName}>{p.name}</div>
                <div style={S.itemUses}>{p.uses.slice(0, 4).join(" · ")}</div>
              </div>
              <div style={S.itemGo}>약박사 ›</div>
            </Link>
          ))}
        </div>
      ) : null}

      {list.length === 0 && submitted.length === 0 ? (
        <div style={S.empty}>맞는 제품이 아직 없습니다. 아래 '문의 남기기'로 물어보시면 맞는 기업을 연결해 드립니다.</div>
      ) : (
        <div style={S.list}>
          {list.map((p) => {
            const c = partnerCompany(p);
            return (
              <Link key={p.id} href={`/yakbaksa?p=${p.id}${crop ? `&crop=${crop.key}` : ""}`} style={S.item}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={S.itemBrand}>{c.name} · {p.group}</div>
                  <div style={S.itemName}>{p.name}</div>
                  <div style={S.itemUses}>{p.uses.slice(0, 4).join(" · ")}</div>
                </div>
                <div style={S.itemGo}>약박사 ›</div>
              </Link>
            );
          })}
        </div>
      )}

      {organic.length ? (
        <div style={{ marginTop: 18 }}>
          <div style={S.sectionTitle}>공시 친환경 자재 중 "{q}" — 사용량은 회사에 전화로</div>
          <div style={S.list}>
            {organic.map((m) => (
              <div key={m.no + m.name} style={S.item}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={S.itemBrand}>{m.company} · {m.kind}</div>
                  <div style={S.itemName}>{m.name}</div>
                </div>
                {m.phone ? <a href={`tel:${m.phone}`} style={S.callBtn}>📞 전화</a> : null}
              </div>
            ))}
          </div>
          <Link href={`/materials?q=${encodeURIComponent(q)}`} style={S.link}>더 보기 ›</Link>
        </div>
      ) : null}

      <div style={S.foot}>
        자료: 참여 기업 카탈로그에서 확인한 제품 {PARTNER_PRODUCTS.length}개 + 기업이 직접 등록한 제품. 기업이시면 <Link href="/register" style={S.link}>제품 등록</Link>으로 올려 주세요(무료, 승인 후 노출).
      </div>

      <div style={{ height: 84 }} />
      <StickyAsk problemSlug="calc" problemTitle="약박사 문의" needsCrop />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "4px 0 20px", maxWidth: 680, margin: "0 auto" },
  back: { fontSize: 13, fontWeight: 800, color: "#15803d", textDecoration: "none" },
  brand: { marginTop: 8, fontSize: 12, fontWeight: 900, color: "#16a34a" },
  hero: { marginTop: 8, display: "flex", gap: 12, alignItems: "flex-end" },
  heroImg: { flexShrink: 0, borderRadius: 16, objectFit: "cover" },
  face: { borderRadius: 999, objectFit: "cover", border: "2px solid #15803d" },
  bubble: { flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 18, borderBottomLeftRadius: 4, background: "#fff", border: "2px solid #15803d" },
  rowTop: { marginTop: 8, display: "flex", gap: 8, alignItems: "center" },
  title: { marginTop: 4, fontSize: 24, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5, wordBreak: "keep-all", lineHeight: 1.2 },
  feature: { marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "#334155", wordBreak: "keep-all" },
  tags: { marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" },
  tag: { fontSize: 12, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#f0fdf4", color: "#14532d" },
  crops: { marginTop: 8, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  searchRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 8 },
  search: { padding: "14px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 },
  searchBtn: { padding: "14px 16px", borderRadius: 12, border: 0, background: "#15803d", color: "#fff", fontWeight: 900, fontSize: 15 },
  chips: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { fontSize: 13, fontWeight: 800, padding: "7px 11px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a", textDecoration: "none" },
  chipOn: { background: "#0f172a", color: "#fff" },
  list: { marginTop: 12, display: "grid", gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 950, color: "#0f172a" },
  callBtn: { padding: "9px 11px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 900, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" },
  item: { display: "flex", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", textDecoration: "none", color: "#0f172a" },
  itemBrand: { fontSize: 12, fontWeight: 800, color: "#16a34a" },
  itemName: { marginTop: 2, fontSize: 17, fontWeight: 950, wordBreak: "keep-all" },
  itemUses: { marginTop: 2, fontSize: 12, color: "#64748b" },
  itemGo: { fontSize: 14, fontWeight: 900, color: "#15803d", whiteSpace: "nowrap" },
  empty: { marginTop: 12, padding: 14, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a", color: "#78350f", fontSize: 14, lineHeight: 1.6 },
  foot: { marginTop: 16, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  link: { color: "#15803d", fontWeight: 800 },
};
