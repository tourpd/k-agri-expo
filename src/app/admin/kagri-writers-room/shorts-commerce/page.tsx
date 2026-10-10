"use client";

import { useEffect, useMemo, useState } from "react";
import { AFFILIATE_NOTICE, isAllowedAffiliateLink, rankProducts, youtubeDescription, type Product } from "@/lib/content-commerce/coupang";

import { normalizeExpoProducts, matchExpoProducts, type ExpoProduct } from "@/lib/content-commerce/expo";

import { buildDailyShortsCommerce } from "@/lib/content-commerce/batch";

const STORE = "kagri-coupang-products-v1";
const clean = (value: string) => value.split(",").map(x => x.trim()).filter(Boolean);

export default function ShortsCommercePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expoProducts, setExpoProducts] = useState<ExpoProduct[]>([]);
  const [expoStatus, setExpoStatus] = useState("미조회");
  const [name, setName] = useState("");
  const [cropTags, setCropTags] = useState("");
  const [keywords, setKeywords] = useState("");
  const [link, setLink] = useState("");
  const [topic, setTopic] = useState("");
  const [dailyInput, setDailyInput] = useState("");
  const [crop, setCrop] = useState("마늘");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "[]");
      if (Array.isArray(saved)) setProducts(saved.filter(p => p && typeof p.id === "string" && typeof p.name === "string"));
    } catch { /* Ignore damaged local data */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORE, JSON.stringify(products)); }, [products, loaded]);
  const matches = useMemo(() => rankProducts(topic, crop, products), [topic, crop, products]);
  const expoMatches = useMemo(() => matchExpoProducts(topic, crop, expoProducts), [topic,crop,expoProducts]);
  async function loadExpo() {
    setExpoStatus("조회 중");
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error("상품 조회 실패");
      const items = normalizeExpoProducts(result.products);
      setExpoProducts(items);
      setExpoStatus(`${items.length}개 조회 완료`);
    } catch { setExpoStatus("조회 실패 — 기존 상품·권한 확인 필요"); }
  }
  const description = useMemo(() => youtubeDescription(topic, matches), [topic, matches]);
  const dailyResults = useMemo(() => buildDailyShortsCommerce(dailyInput.split("\n").filter(Boolean).map((line, i) => {
    const [c, ...parts] = line.split("|");
    return { id: String(i+1), crop: c?.trim() || "", topic: parts.join("|").trim() };
  }), products, expoProducts), [dailyInput, products, expoProducts]);

  function exportBatch() {
    const payload = {
      schema: "kagri.shorts-commerce.v1",
      exportedAt: new Date().toISOString(),
      status: "review_required",
      items: dailyResults,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kagri-shorts-commerce-batch.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !isAllowedAffiliateLink(link)) {
      setError("상품명을 입력하고 쿠팡의 HTTPS 상품·파트너스 링크인지 확인하세요.");
      return;
    }
    if (products.some(p => p.link === link.trim())) { setError("이미 등록된 링크입니다."); return; }
    setProducts(p => [...p, {
      id: crypto.randomUUID(), name: name.trim(), crops: clean(cropTags),
      keywords: clean(keywords), link: link.trim(), approved: false,
    }]);
    setName(""); setCropTags(""); setKeywords(""); setLink(""); setError("");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(description); setCopied(true); }
    catch { setError("복사 권한을 확인하거나 설명문을 직접 선택해 복사하세요."); }
  }
  return <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-[#173d2e] p-7 text-white">
        <p className="font-bold text-green-200">K-AGRI 작가실 / 콘텐츠 수익화</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">🛒 쇼츠 상품연결 센터 v1</h1>
        <p className="mt-3 text-lg">승인된 쿠팡 제휴 링크를 작물·영상 주제에 맞춰 추천하고 유튜브 설명문을 만듭니다.</p>
        <p className="mt-2 text-sm text-green-100">현재 데이터는 이 브라우저에만 저장됩니다. 쿠팡 API 검색, 실제 상품 판매량 조회, 영상 업로드는 아직 연결되지 않았습니다.</p>
      </header>
      <section className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={addProduct} className="space-y-3 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-2xl font-black">1. 쿠팡 상품 등록</h2>
          <label className="block font-bold">상품명<input className="mt-1 w-full rounded-lg border p-3" value={name} onChange={e=>setName(e.target.value)} required placeholder="예: 디지털 토양 산도 측정기"/></label>
          <label className="block font-bold">관련 작물 (쉼표로 구분)<input className="mt-1 w-full rounded-lg border p-3" value={cropTags} onChange={e=>setCropTags(e.target.value)} placeholder="마늘, 양파, 고추"/></label>
          <label className="block font-bold">사용 목적·검색 키워드<input className="mt-1 w-full rounded-lg border p-3" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="토양 산도, pH, 토양 검사"/></label>
          <label className="block font-bold">쿠팡파트너스에서 발급한 링크<input type="url" className="mt-1 w-full rounded-lg border p-3" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://link.coupang.com/..." required/></label>
          <button className="rounded-xl bg-green-800 px-6 py-3 font-black text-white" type="submit">상품 추가</button>
          <p className="text-sm text-stone-600">등록 후 아래에서 적합성·가격·판매상태·제휴 링크를 확인하고 승인하세요. 쿠팡 일반 링크만으로 제휴 수익이 생기지는 않습니다.</p>
        </form>
        <section className="space-y-3 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-2xl font-black">2. 콘텐츠별 상품 추천</h2>
          <label className="block font-bold">작물<select value={crop} onChange={e=>setCrop(e.target.value)} className="mt-1 w-full rounded-lg border p-3">{["마늘","고추","딸기","양파","감자","토마토","기타"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="block font-bold">쇼츠 주제<textarea className="mt-1 w-full rounded-lg border p-3" rows={3} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="마늘 파종 전 토양 산도 측정과 배수 관리"/></label>
          <p className="font-black">자동 추천 {matches.length}개 (최대 3개)</p>
          {!matches.length && <p className="rounded-lg bg-stone-100 p-4 text-stone-600">관련성이 확인된 승인 상품이 없습니다. 상품을 억지로 붙이지 않습니다.</p>}
          {matches.map(p=><div className="rounded-xl border p-3" key={p.id}><p className="font-bold">{p.name} · {p.score}점</p><p className="text-sm text-stone-600">{p.reasons.join(" / ")}</p></div>)}
        </section>
      </section>
      <section className="space-y-3 rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-black">K-AGRI EXPO 상품 추천 (읽기 전용)</h2>
        <p className="text-sm text-stone-700">기존 EXPO 판매 상품을 조회해 쇼츠 주제에 맞춰 추천합니다. 쿠팡 제휴 수익과 별도입니다. 결과가 있더라도 적합성과 현재 판매 가능 여부는 검수하세요.</p>
        <button type="button" onClick={loadExpo} className="rounded-xl border-2 border-green-800 px-5 py-3 font-bold">EXPO 상품 불러오기</button>
        <span className="ml-3 text-sm text-stone-600" role="status">{expoStatus}</span>
        <div className="space-y-2">{expoMatches.map(p=><div key={p.id} className="rounded-xl border p-3">
          <p className="font-black">{p.name} · 관련성 {p.score}점</p>
          <p className="text-sm text-stone-600">{p.category} / {p.description.slice(0,130)}</p>
          {p.buyUrl ? <a className="text-green-800 underline" target="_blank" rel="noopener noreferrer" href={p.buyUrl}>기존 판매 페이지 확인</a> : <p className="text-sm text-stone-500">판매 링크 미등록</p>}
        </div>)}</div>
        {expoProducts.length>0 && expoMatches.length===0 && <p className="text-sm text-stone-600">해당 작물·주제에 맞는 상품이 없습니다.</p>}
      </section>
      <section className="space-y-3 rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-black">하루 쇼츠 5편 일괄 상품 추천</h2>
        <p className="text-sm text-stone-600">작물 | 쇼츠 제목 형식으로 한 줄씩 입력하세요. 최대 5편을 준비하며 상품 적합성 검수가 필요합니다.</p>
        <textarea className="w-full rounded-lg border p-3" rows={6} value={dailyInput} onChange={e=>setDailyInput(e.target.value)} placeholder={"마늘 | 토양 산도 측정과 검사\n딸기 | 하우스 온습도 관리\n고추 | 관수 타이머 사용법"} />
        <button type="button" disabled={!dailyResults.length} onClick={exportBatch} className="rounded-xl bg-green-800 px-5 py-3 font-bold text-white disabled:opacity-50">5편 상품연결 JSON 내보내기</button>
        {dailyResults.map(item=><div className="rounded-xl border p-3" key={item.id}>
          <p className="font-black">{item.id}편 · {item.crop} · {item.topic}</p>
          <p className="text-sm">쿠팡 승인상품 {item.affiliateProducts.length}개 / EXPO 후보 {item.expoProducts.length}개</p>
          <p className="text-xs text-stone-600">{item.affiliateProducts.map(p=>p.name).join(", ") || "쿠팡 추천 없음"} · {item.expoProducts.map(p=>p.name).join(", ") || "EXPO 추천 없음"}</p>
          <button type="button" className="mt-2 rounded-lg border px-3 py-2 text-sm" onClick={()=>navigator.clipboard.writeText(item.youtubeDescription)}>이 편 설명문 복사</button>
          <p className="mt-1 text-xs text-amber-800">게시 전 상품 적합성·광고 고지 검수 필요</p>
        </div>)}
      </section>
      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-3 text-2xl font-black">3. 상품 검수 및 승인 ({products.length}개 등록)</h2>
        {!products.length && <p className="text-stone-600">등록 상품이 없습니다. 실제 쿠팡 판매량이나 상품을 임의로 생성하지 않습니다.</p>}
        <div className="space-y-3">{products.map(p=><div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <div className="min-w-0 flex-1"><p className="font-bold">{p.name}</p><p className="break-all text-xs text-stone-600">{p.link}</p><p className="text-xs">{p.crops.join(", ")} · {p.keywords.join(", ")}</p></div>
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={p.approved} onChange={e=>setProducts(all=>all.map(x=>x.id===p.id?{...x,approved:e.target.checked}:x))}/> 상품·제휴링크 검수 완료</label>
          <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>setProducts(all=>all.filter(x=>x.id!==p.id))}>삭제</button>
        </div>)}</div>
      </section>
      <section className="space-y-3 rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-black">4. 유튜브 설명문 생성</h2>
        <textarea className="w-full rounded-xl border bg-stone-50 p-4 font-mono text-sm" rows={Math.max(8, matches.length*2+7)} readOnly value={description}/>
        <button type="button" onClick={copy} className="rounded-xl bg-green-800 px-6 py-3 font-black text-white">{copied?"복사됨":"설명문 복사"}</button>
        <p className="text-sm text-stone-600">제휴 수익 발생 시 고지가 자동 포함됩니다. 쇼츠 일반 URL은 클릭되지 않을 수 있으므로 프로필 상품 안내 페이지 또는 이용 가능한 YouTube Shopping 태그도 검토하세요.</p>
        <p className="text-xs text-stone-500">고지 문안: {AFFILIATE_NOTICE}</p>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-900">{error}</p>}
    </div>
  </main>;
}
