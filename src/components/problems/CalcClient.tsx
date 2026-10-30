"use client";

import React, { useMemo, useState } from "react";
import { calcDose, DEFAULT_TANK_L, toPyeong, type DoseResult } from "@/lib/problems/dose-calc";
import type { DoseRule, PartnerProduct } from "@/lib/problems/partner-catalog";

type AreaUnit = "평" | "마지기" | "a" | "ha" | "㎡";

export type BuyLink = { label: string; href: string; kind: "ours" | "coupang" | "company"; sub?: string };

/**
 * 살포량 계산기 (화면 쪽)
 * 입력 3개: 평수(+단위), 분무기 통 크기, (제품의 사용법이 여러 줄이면) 어느 줄인지
 * 결과: 사야 할 양 · 물 몇 통 · 한 통에 몇 ml · 언제 몇 번 · 주의 · 출처
 */
export default function CalcClient({
  product,
  companyName,
  initialArea = 300,
  buyLinks,
}: {
  product: PartnerProduct;
  companyName: string;
  initialArea?: number;
  buyLinks: BuyLink[];
}) {
  const [areaText, setAreaText] = useState(String(initialArea));
  const [unit, setUnit] = useState<AreaUnit>("평");
  const [tank, setTank] = useState<number>(DEFAULT_TANK_L);
  const [ruleIdx, setRuleIdx] = useState(0);

  const areaPyeong = useMemo(() => {
    const v = parseFloat(areaText.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.round(toPyeong(v, unit));
  }, [areaText, unit]);

  const rule: DoseRule | undefined = product.doses[ruleIdx] ?? product.doses[0];
  const result: DoseResult | null = rule && areaPyeong > 0 ? calcDose(product, rule, areaPyeong, tank) : null;

  return (
    <div>
      <style>{CSS}</style>

      {/* 입력 */}
      <div className="calc-box">
        <div className="calc-row">
          <label className="calc-label">
            내 밭
            <div className="calc-inline">
              <input
                className="calc-input"
                inputMode="decimal"
                value={areaText}
                onChange={(e) => setAreaText(e.target.value)}
                aria-label="면적"
              />
              <select className="calc-select" value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)} aria-label="면적 단위">
                <option value="평">평</option>
                <option value="마지기">마지기(200평)</option>
                <option value="a">a(아르)</option>
                <option value="ha">ha</option>
                <option value="㎡">㎡</option>
              </select>
            </div>
          </label>
          <label className="calc-label">
            분무기 통
            <select className="calc-select" value={tank} onChange={(e) => setTank(Number(e.target.value))} aria-label="통 크기">
              <option value={20}>20L (1말)</option>
              <option value={25}>25L</option>
              <option value={200}>200L</option>
              <option value={500}>500L (SS기)</option>
              <option value={1000}>1,000L</option>
            </select>
          </label>
        </div>
        <div className="calc-quick">
          {[100, 300, 600, 1000, 3000].map((n) => (
            <button key={n} type="button" className={`calc-chip ${unit === "평" && areaText === String(n) ? "on" : ""}`} onClick={() => { setUnit("평"); setAreaText(String(n)); }}>
              {n.toLocaleString()}평
            </button>
          ))}
        </div>
        {product.doses.length > 1 ? (
          <div className="calc-rules">
            {product.doses.map((d, i) => (
              <button key={i} type="button" className={`calc-rule ${i === ruleIdx ? "on" : ""}`} onClick={() => setRuleIdx(i)}>
                {ruleLabel(d)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* 결과 */}
      {result ? (
        <div className="calc-result">
          <div className="calc-head">{areaPyeong.toLocaleString()}평 기준</div>
          {result.productAmount != null ? (
            <>
              <div className="calc-big">
                {result.packages[0] ? (
                  <>
                    <span className="calc-num">{result.packages[0].label} × {result.packages[0].count}</span>
                    <span className="calc-sub">사면 됩니다 ({result.packages[0].leftover})</span>
                  </>
                ) : (
                  <span className="calc-num">{fmtAmt(result.productAmount, result.productUnit!)}</span>
                )}
              </div>
              {result.packages.length > 1 ? (
                <div className="calc-alt">
                  다른 포장: {result.packages.slice(1).map((p) => `${p.label} × ${p.count}`).join(" / ")}
                </div>
              ) : null}
              <div className="calc-grid">
                {result.perTank != null ? (
                  <div className="calc-cell">
                    <div className="calc-cell-k">{tank}L 한 통에</div>
                    <div className="calc-cell-v">{fmtAmt(result.perTank, result.productUnit!)}</div>
                  </div>
                ) : null}
                {result.waterL != null ? (
                  <div className="calc-cell">
                    <div className="calc-cell-k">물</div>
                    <div className="calc-cell-v">약 {Math.round(result.waterL).toLocaleString()}L · {result.tanks}통</div>
                  </div>
                ) : null}
                <div className="calc-cell">
                  <div className="calc-cell-k">제품 총량</div>
                  <div className="calc-cell-v">{fmtAmt(result.productAmount, result.productUnit!)}</div>
                </div>
                <div className="calc-cell">
                  <div className="calc-cell-k">방법</div>
                  <div className="calc-cell-v">{"method" in rule! ? rule!.method : "-"}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="calc-text">{result.headline}</div>
          )}
          {result.note ? <div className="calc-note">※ {result.note}</div> : null}
          {result.assumptions.map((a, i) => (
            <div key={i} className="calc-note">※ {a}</div>
          ))}
        </div>
      ) : (
        <div className="calc-result calc-empty">평수를 넣으면 바로 계산됩니다.</div>
      )}

      {/* 언제 */}
      <div className="calc-when">
        <div className="calc-when-k">언제 · 몇 번</div>
        <div className="calc-when-v">{product.timing}</div>
        {product.cautions?.length ? (
          <ul className="calc-cautions">
            {product.cautions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        ) : null}
        <div className="calc-src">
          출처: {product.source.label}{product.source.page ? ` ${product.source.page}쪽` : ""} · 숫자는 자료 그대로입니다. 1회 살포 기준이며 횟수만큼 곱하세요.
        </div>
      </div>

      {/* 사기 */}
      {buyLinks.length ? (
        <div className="calc-buy">
          {buyLinks.map((b, i) => (
            <a key={i} href={b.href} target={b.kind === "company" ? undefined : "_blank"} rel="noreferrer" className={`calc-buy-btn ${b.kind}`}>
              <span>{b.label}</span>
              {b.sub ? <span className="calc-buy-sub">{b.sub}</span> : null}
            </a>
          ))}
          <div className="calc-note">쿠팡 링크로 구매하시면 한국농수산TV에 소정의 수수료가 지급될 수 있습니다. 가격은 판매처마다 다릅니다.</div>
        </div>
      ) : null}
      <div className="calc-note" style={{ marginTop: 8 }}>
        {companyName} 제품 · 재배 조건에 따라 양을 가감하세요. 농약이 아닌 자재이며, 농약은 등록된 사용기준을 따릅니다.
      </div>
    </div>
  );
}

function ruleLabel(d: DoseRule) {
  if (d.kind === "text") return "안내";
  if (d.kind === "dilution") {
    const r = d.ratioMax ? `${d.ratio.toLocaleString()}~${d.ratioMax.toLocaleString()}배` : `${d.ratio.toLocaleString()}배`;
    return `${d.method} ${r}${d.crops ? ` · ${d.crops}` : ""}`;
  }
  const amt = d.unit === "L" || d.unit === "kg" ? `${d.amount}${d.unit}` : `${d.amount}${d.unit}`;
  return `${d.method} ${amt}/${d.areaPyeong}평${d.waterL ? `/물 ${d.waterL}L` : ""}${d.crops ? ` · ${d.crops}` : ""}`;
}

function fmtAmt(n: number, unit: "ml" | "g") {
  if (n >= 1000) return `${Math.round((n / 1000) * 100) / 100}${unit === "ml" ? "L" : "kg"}`;
  return `${n < 10 ? Math.round(n * 10) / 10 : Math.round(n)}${unit}`;
}

const CSS = `
.calc-box { margin-top: 12px; padding: 14px; border-radius: 18px; background: #fff; border: 1px solid #e5e7eb; }
.calc-row { display: grid; grid-template-columns: 1fr; gap: 10px; }
@media (min-width: 520px) { .calc-row { grid-template-columns: 3fr 2fr; } }
.calc-label { display: grid; gap: 6px; font-size: 13px; font-weight: 900; color: #334155; }
.calc-inline { display: grid; grid-template-columns: minmax(110px, 1fr) minmax(0, 150px); gap: 6px; }
.calc-input { padding: 14px 12px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 22px; font-weight: 900; color: #0f172a; width: 100%; min-width: 0; box-sizing: border-box; text-align: right; }
.calc-select { padding: 12px 8px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 15px; font-weight: 800; color: #0f172a; background: #fff; min-width: 0; width: 100%; box-sizing: border-box; }
.calc-quick { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.calc-chip { padding: 8px 12px; border-radius: 999px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; font-weight: 800; font-size: 13px; cursor: pointer; }
.calc-chip.on { background: #15803d; color: #fff; border-color: #15803d; }
.calc-rules { margin-top: 12px; display: grid; gap: 6px; }
.calc-rule { text-align: left; padding: 10px 12px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 13px; font-weight: 800; color: #334155; cursor: pointer; }
.calc-rule.on { border-color: #15803d; background: #f0fdf4; color: #14532d; }
.calc-result { margin-top: 12px; padding: 16px; border-radius: 18px; background: #0f172a; color: #fff; }
.calc-empty { background: #f1f5f9; color: #475569; font-weight: 700; }
.calc-head { font-size: 13px; font-weight: 800; color: #94a3b8; }
.calc-big { margin-top: 4px; display: flex; flex-direction: column; gap: 2px; }
.calc-num { font-size: 32px; font-weight: 950; letter-spacing: -0.5px; }
.calc-sub { font-size: 14px; color: #cbd5e1; font-weight: 700; }
.calc-alt { margin-top: 6px; font-size: 13px; color: #cbd5e1; }
.calc-grid { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.calc-cell { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.08); }
.calc-cell-k { font-size: 12px; color: #94a3b8; font-weight: 800; }
.calc-cell-v { margin-top: 2px; font-size: 17px; font-weight: 950; }
.calc-text { font-size: 15px; line-height: 1.6; font-weight: 700; }
.calc-note { margin-top: 8px; font-size: 12px; color: #64748b; line-height: 1.6; }
.calc-result .calc-note { color: #cbd5e1; }
.calc-when { margin-top: 12px; padding: 14px; border-radius: 18px; background: #fff; border: 1px solid #e5e7eb; }
.calc-when-k { font-size: 13px; font-weight: 950; color: #0f172a; }
.calc-when-v { margin-top: 6px; font-size: 15px; line-height: 1.6; color: #1e293b; word-break: keep-all; }
.calc-cautions { margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6; }
.calc-src { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6; }
.calc-buy { margin-top: 12px; display: grid; gap: 8px; }
.calc-buy-btn { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 14px; text-decoration: none; font-weight: 900; font-size: 16px; }
.calc-buy-btn.ours { background: #15803d; color: #fff; }
.calc-buy-btn.coupang { background: #fff; border: 2px solid #e11d48; color: #be123c; }
.calc-buy-btn.company { background: #f1f5f9; color: #0f172a; }
.calc-buy-sub { font-size: 12px; font-weight: 700; opacity: .8; }
`;
