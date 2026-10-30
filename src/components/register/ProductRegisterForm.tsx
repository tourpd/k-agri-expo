"use client";

import React, { useState } from "react";

type ProblemOpt = { slug: string; title: string; cropLabel: string };

/**
 * 기업 셀프 제품 등록 폼 — 농민이 바로 쓸 수 있는 정보만 묻습니다.
 * 필수: 회사·전화·제품명·사용량(희석배수 또는 ○ml/○평)·동의
 */
export default function ProductRegisterForm({ problems }: { problems: ProblemOpt[] }) {
  const [f, setF] = useState<Record<string, string>>({ dose_method: "엽면", area_unit: "ml" });
  const [picked, setPicked] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [doseMode, setDoseMode] = useState<"dilution" | "area">("dilution");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/register/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, problem_slugs: picked, agree, sellable: f.sellable !== "no" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setState("error");
        setMsg(json?.error || "접수에 실패했습니다.");
        return;
      }
      setState("done");
      setMsg(json.notice || "접수되었습니다.");
    } catch {
      setState("error");
      setMsg("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (state === "done") {
    return (
      <div className="rg-done">
        <style>{CSS}</style>
        <div className="rg-done-title">접수됐습니다</div>
        <div>{msg}</div>
        <div className="rg-done-sub">승인되면 해당 문제 페이지와 약박사에 바로 보이고, 농민 문의·전화가 귀사로 직접 갑니다.</div>
        <button type="button" className="rg-btn" onClick={() => { setState("idle"); setF((p) => ({ company_name: p.company_name, company_phone: p.company_phone, company_email: p.company_email ?? "", contact_name: p.contact_name ?? "", homepage_url: p.homepage_url ?? "", dose_method: "엽면", area_unit: "ml" })); setPicked([]); }}>
          같은 회사 제품 하나 더 등록
        </button>
      </div>
    );
  }

  const byCrop = problems.reduce<Record<string, ProblemOpt[]>>((acc, p) => {
    (acc[p.cropLabel] ||= []).push(p);
    return acc;
  }, {});

  return (
    <form onSubmit={submit} className="rg">
      <style>{CSS}</style>
      {/* 꿀단지 */}
      <input name="website" value={f.website ?? ""} onChange={set("website")} className="rg-hp" tabIndex={-1} autoComplete="off" />

      <section className="rg-sec">
        <div className="rg-sec-title">1. 회사</div>
        <label className="rg-label">회사 이름 *<input className="rg-input" value={f.company_name ?? ""} onChange={set("company_name")} required placeholder="예: (주)도프" /></label>
        <label className="rg-label">농민이 걸 전화번호 *<input className="rg-input" inputMode="tel" value={f.company_phone ?? ""} onChange={set("company_phone")} required placeholder="031-000-0000" /></label>
        <div className="rg-row">
          <label className="rg-label">담당자<input className="rg-input" value={f.contact_name ?? ""} onChange={set("contact_name")} /></label>
          <label className="rg-label">이메일<input className="rg-input" inputMode="email" value={f.company_email ?? ""} onChange={set("company_email")} /></label>
        </div>
        <label className="rg-label">홈페이지<input className="rg-input" inputMode="url" value={f.homepage_url ?? ""} onChange={set("homepage_url")} placeholder="https://" /></label>
      </section>

      <section className="rg-sec">
        <div className="rg-sec-title">2. 제품</div>
        <label className="rg-label">제품 이름 *<input className="rg-input" value={f.product_name ?? ""} onChange={set("product_name")} required placeholder="예: 싹쓰리-충" /></label>
        <div className="rg-row">
          <label className="rg-label">종류
            <select className="rg-input" value={f.product_group ?? ""} onChange={set("product_group")}>
              <option value="">선택</option>
              {["친환경 해충 자재", "친환경 병해 자재", "영양제·생리활성제", "비료", "토양개량제", "농기구·설비", "묘종·종자", "기타"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="rg-label">공시번호(있으면)<input className="rg-input" value={f.organic_cert_no ?? ""} onChange={set("organic_cert_no")} placeholder="공시-2-5-275" /></label>
        </div>
        <label className="rg-label">한 줄 설명 (농민에게 보이는 말)<input className="rg-input" value={f.feature ?? ""} onChange={set("feature")} placeholder="예: 식물추출물로 만든 진딧물·나방류 전용 해충방제제" /></label>
        <label className="rg-label">어떤 문제에 쓰나 (쉼표로)<input className="rg-input" value={f.uses ?? ""} onChange={set("uses")} placeholder="진딧물, 담배거세미나방, 흡즙해충" /></label>
        <label className="rg-label">대상작물 (쉼표로)<input className="rg-input" value={f.crops ?? ""} onChange={set("crops")} placeholder="고추, 토마토, 오이, 딸기" /></label>
        <label className="rg-label">주요 성분<input className="rg-input" value={f.ingredients ?? ""} onChange={set("ingredients")} /></label>
      </section>

      <section className="rg-sec">
        <div className="rg-sec-title">3. 사용량 * — 농민이 "600평이면 몇 병"을 바로 알게 해 주는 칸입니다</div>
        <div className="rg-tabs">
          <button type="button" className={`rg-tab ${doseMode === "dilution" ? "on" : ""}`} onClick={() => setDoseMode("dilution")}>희석배수로</button>
          <button type="button" className={`rg-tab ${doseMode === "area" ? "on" : ""}`} onClick={() => setDoseMode("area")}>평수당 양으로</button>
        </div>
        <label className="rg-label">방법
          <select className="rg-input" value={f.dose_method} onChange={set("dose_method")}>
            {["엽면", "관주", "살포", "토양", "침지"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {doseMode === "dilution" ? (
          <div className="rg-row">
            <label className="rg-label">희석배수 (진하게)<input className="rg-input" inputMode="numeric" value={f.dilution_ratio ?? ""} onChange={set("dilution_ratio")} placeholder="1000" /></label>
            <label className="rg-label">~ (묽게, 선택)<input className="rg-input" inputMode="numeric" value={f.dilution_ratio_max ?? ""} onChange={set("dilution_ratio_max")} placeholder="2000" /></label>
          </div>
        ) : (
          <div className="rg-row3">
            <label className="rg-label">양<input className="rg-input" inputMode="decimal" value={f.area_amount ?? ""} onChange={set("area_amount")} placeholder="500" /></label>
            <label className="rg-label">단위
              <select className="rg-input" value={f.area_unit} onChange={set("area_unit")}>{["ml", "L", "g", "kg"].map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </label>
            <label className="rg-label">평수<input className="rg-input" inputMode="numeric" value={f.area_pyeong ?? ""} onChange={set("area_pyeong")} placeholder="750" /></label>
            <label className="rg-label">물(L, 선택)<input className="rg-input" inputMode="numeric" value={f.area_water_l ?? ""} onChange={set("area_water_l")} placeholder="500" /></label>
          </div>
        )}
        <label className="rg-label">언제·몇 번<input className="rg-input" value={f.timing ?? ""} onChange={set("timing")} placeholder="발생 초기 7일 간격 2~3회" /></label>
        <label className="rg-label">주의사항 (쉼표로)<input className="rg-input" value={f.cautions ?? ""} onChange={set("cautions")} placeholder="소면적 시험 후 사용, 고온기 피하기" /></label>
      </section>

      <section className="rg-sec">
        <div className="rg-sec-title">4. 판매</div>
        <div className="rg-row3">
          <label className="rg-label">포장 (쉼표로)<input className="rg-input" value={f.packages ?? ""} onChange={set("packages")} placeholder="500ml, 1L, 2L" /></label>
          <label className="rg-label">대표 가격(원)<input className="rg-input" inputMode="numeric" value={f.price_krw ?? ""} onChange={set("price_krw")} placeholder="45000" /></label>
          <label className="rg-label">온라인 판매
            <select className="rg-input" value={f.sellable ?? "yes"} onChange={set("sellable")}><option value="yes">가능</option><option value="no">불가(농약 등)</option></select>
          </label>
        </div>
        <label className="rg-label">구매 링크 (자사몰·스마트스토어)<input className="rg-input" inputMode="url" value={f.buy_url ?? ""} onChange={set("buy_url")} placeholder="https://" /></label>
        <label className="rg-label">제품 사진 주소<input className="rg-input" inputMode="url" value={f.image_url ?? ""} onChange={set("image_url")} placeholder="https://…/photo.jpg" /></label>
      </section>

      <section className="rg-sec">
        <div className="rg-sec-title">5. 어느 문제 페이지에 올릴까요 (여러 개 가능)</div>
        {Object.entries(byCrop).map(([crop, list]) => (
          <div key={crop} className="rg-crop">
            <div className="rg-crop-name">{crop}</div>
            <div className="rg-chips">
              {list.map((p) => {
                const on = picked.includes(p.slug);
                return (
                  <button key={p.slug} type="button" className={`rg-chip ${on ? "on" : ""}`} onClick={() => setPicked((cur) => (on ? cur.filter((x) => x !== p.slug) : [...cur, p.slug]))}>
                    {p.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <label className="rg-agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>등록한 내용은 사실이며, 농민에게 회사명·전화번호와 함께 공개되는 데 동의합니다. 효능 표현은 등록·공시된 범위 안에서만 적었습니다.</span>
      </label>

      {state === "error" ? <div className="rg-error">{msg}</div> : null}
      <button type="submit" className="rg-btn" disabled={state === "sending"}>{state === "sending" ? "보내는 중…" : "등록 신청 (무료)"}</button>
      <div className="rg-fine">운영자 확인 후 노출됩니다. 허위·과장 내용은 반려될 수 있습니다.</div>
    </form>
  );
}

const CSS = `
.rg { display: grid; gap: 14px; margin-top: 12px; }
.rg-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.rg-sec { padding: 14px; border-radius: 16px; background: #fff; border: 1px solid #e5e7eb; display: grid; gap: 10px; }
.rg-sec-title { font-size: 15px; font-weight: 950; color: #0f172a; }
.rg-label { display: grid; gap: 4px; font-size: 13px; font-weight: 800; color: #334155; }
.rg-input { padding: 12px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 16px; color: #0f172a; background: #fff; width: 100%; box-sizing: border-box; }
.rg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.rg-row3 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (min-width: 560px) { .rg-row3 { grid-template-columns: repeat(4, 1fr); } }
.rg-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.rg-tab { padding: 10px; border-radius: 12px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; font-weight: 900; cursor: pointer; }
.rg-tab.on { background: #15803d; color: #fff; border-color: #15803d; }
.rg-crop-name { font-size: 12px; font-weight: 900; color: #16a34a; margin-top: 4px; }
.rg-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.rg-chip { padding: 7px 10px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; color: #0f172a; font-size: 12px; font-weight: 800; cursor: pointer; }
.rg-chip.on { background: #0f172a; color: #fff; border-color: #0f172a; }
.rg-agree { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #334155; line-height: 1.6; }
.rg-agree input { margin-top: 4px; width: 18px; height: 18px; }
.rg-error { color: #b91c1c; font-weight: 800; font-size: 14px; }
.rg-btn { padding: 16px; border-radius: 14px; border: 0; background: #15803d; color: #fff; font-weight: 950; font-size: 17px; cursor: pointer; }
.rg-fine { font-size: 12px; color: #94a3b8; text-align: center; }
.rg-done { margin-top: 16px; padding: 20px; border-radius: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; display: grid; gap: 8px; color: #14532d; font-size: 15px; }
.rg-done-title { font-size: 22px; font-weight: 950; }
.rg-done-sub { font-size: 13px; color: #166534; line-height: 1.6; }
`;
