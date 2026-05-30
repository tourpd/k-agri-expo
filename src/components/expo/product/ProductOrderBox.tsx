"use client";

import React, { useEffect, useState } from "react";
import PhoneInput from "@/components/common/PhoneInput";
import { formatPhoneInput, parsePhoneInput } from "@/lib/formatters";

type Props = {
  productId?: string;
  boothId?: string;
  productName?: string;
  purchaseUrl?: string;
  ctaText?: string;

  promoType?: string;
  promoTitle?: string;
  promoReason?: string;
  promoCondition?: string;

  priceKrw?: number | null;
  salePriceKrw?: number | null;

  coveragePerUnit?: number | null;
};

type SavedFarmer = {
  name?: string;
  phone?: string;
  region?: string;
  mainCrop?: string;
  farmArea?: string;
};

const FARMER_STORAGE_KEY = "kagri_farmer_profile_v1";

function parseArea(value: string) {
  return String(value || "").replace(/[^\d]/g, "");
}

function formatArea(value: string) {
  const digits = parseArea(value);

  if (!digits) return "";

  return `${Number(digits).toLocaleString("ko-KR")}평`;
}

function calculateQuantity(area: string, coveragePerUnit?: number | null) {
  const areaNum = Number(parseArea(area));
  const coverage = Number(coveragePerUnit || 300);

  if (!areaNum || areaNum <= 0) {
    return 1;
  }

  if (!coverage || coverage <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(areaNum / coverage));
}

function readSavedFarmer(): SavedFarmer | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FARMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedFarmer;
  } catch {
    return null;
  }
}

function saveFarmerProfile(profile: SavedFarmer) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FARMER_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage 저장 실패는 주문 흐름을 막지 않음
  }
}

export default function ProductOrderBox({
  productId,
  boothId,
  productName,
  purchaseUrl,
  ctaText,
  promoType,
  promoTitle,
  promoReason,
  promoCondition,
  priceKrw,
  salePriceKrw,
  coveragePerUnit,
}: Props) {
  const [open, setOpen] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerRegion, setBuyerRegion] = useState("");
  const [mainCrop, setMainCrop] = useState("");
  const [farmArea, setFarmArea] = useState("");

  const [buyerMemo, setBuyerMemo] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  const baseCoverage = Number(coveragePerUnit || 300);

  useEffect(() => {
    const saved = readSavedFarmer();
    if (!saved) return;

    if (saved.name) setBuyerName(saved.name);
    if (saved.phone) setBuyerPhone(parsePhoneInput(saved.phone));
    if (saved.region) setBuyerRegion(saved.region);
    if (saved.mainCrop) setMainCrop(saved.mainCrop);

    if (saved.farmArea) {
      const area = parseArea(saved.farmArea);
      setFarmArea(area);
      setQuantity(calculateQuantity(area, coveragePerUnit));
    }

    setAutoFilled(true);
  }, [coveragePerUnit]);

  async function submitOrder() {
    if (saving) return;

    const phoneDigits = parsePhoneInput(buyerPhone);
    const areaDigits = parseArea(farmArea);
    const areaNumber = Number(areaDigits || 0);
    const autoQuantity = calculateQuantity(areaDigits, coveragePerUnit);

    if (!buyerName.trim()) {
      setError("성함을 입력해 주세요.");
      return;
    }

    if (!phoneDigits) {
      setError("연락처를 입력해 주세요.");
      return;
    }

    if (phoneDigits.length < 10) {
      setError("연락처를 정확히 입력해 주세요.");
      return;
    }

    if (!buyerRegion.trim()) {
      setError("지역을 입력해 주세요.");
      return;
    }

    if (!mainCrop.trim()) {
      setError("주요 작물을 입력해 주세요.");
      return;
    }

    if (!areaDigits) {
      setError("재배평수를 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const finalQuantity =
      Number.isFinite(autoQuantity) && autoQuantity > 0 ? autoQuantity : 1;

    const savedProfile: SavedFarmer = {
      name: buyerName.trim(),
      phone: phoneDigits,
      region: buyerRegion.trim(),
      mainCrop: mainCrop.trim(),
      farmArea: areaDigits,
    };

    const memoParts = [
      mainCrop.trim() ? `주요작물: ${mainCrop.trim()}` : "",
      areaNumber
        ? `재배평수: ${areaNumber.toLocaleString("ko-KR")}평`
        : "",
      `1병 기준: ${baseCoverage.toLocaleString("ko-KR")}평`,
      `자동계산 주문량: ${finalQuantity}병`,
      buyerMemo.trim() ? `문의내용: ${buyerMemo.trim()}` : "",
    ].filter(Boolean);

    const payload = {
      product_id: productId || "",
      booth_id: boothId || "",
      product_name: productName || "제품명 미입력",

      order_type: promoType || "trial",

      promo_type: promoType || "trial",
      promo_title: promoTitle || productName || "K-Agri Expo 신청",
      promo_reason: promoReason || `${productName || "상품"} 체험/주문 신청`,
      promo_condition: promoCondition || "신청 후 담당자가 확인 연락드립니다.",

      price_krw: priceKrw ?? null,
      sale_price_krw: salePriceKrw ?? null,

      buyer_name: buyerName.trim(),
      buyer_phone: phoneDigits,
      buyer_region: buyerRegion.trim(),
      buyer_memo: memoParts.join(" / "),
      quantity: finalQuantity,

      farm_area: areaNumber,
      coverage_per_unit: baseCoverage,
      recommended_quantity: finalQuantity,

      source: "expo_product",
    };

    try {
      const res = await fetch("/api/expo/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "신청에 실패했습니다.");
      }

      saveFarmerProfile(savedProfile);

      setQuantity(finalQuantity);
      setMessage("신청이 접수되었습니다. 확인 후 연락드리겠습니다.");
      setAutoFilled(true);
      setBuyerMemo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.box}>
      <button type="button" style={S.buyBtn} onClick={() => setOpen(!open)}>
        {ctaText || "신청하기"}
      </button>

      {open ? (
        <div style={S.formBox}>
          <div style={S.title}>체험/주문 신청</div>

          {autoFilled ? (
            <div style={S.autoNotice}>
              이전에 입력한 농민 정보가 자동으로 채워졌습니다.
            </div>
          ) : (
            <div style={S.autoNotice}>
              한 번 입력하면 다음 신청부터 자동 입력됩니다.
            </div>
          )}

          {promoTitle ? <div style={S.promoTitle}>{promoTitle}</div> : null}
          {promoReason ? <div style={S.promoText}>{promoReason}</div> : null}
          {promoCondition ? (
            <div style={S.condition}>참여 조건: {promoCondition}</div>
          ) : null}

          <div style={S.sectionTitle}>기본 정보</div>

          <label style={S.label}>성함</label>
          <input
            style={S.input}
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="예: 김복남"
          />

          <label style={S.label}>연락처</label>
          <PhoneInput
            value={buyerPhone}
            onChange={setBuyerPhone}
            placeholder="예: 010-2222-3333"
            className="h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[15px] font-bold text-slate-950 placeholder:text-slate-400 outline-none"
          />

          {buyerPhone ? (
            <div style={S.phonePreview}>표시: {formatPhoneInput(buyerPhone)}</div>
          ) : null}

          <div style={S.sectionTitle}>농장 정보</div>

          <label style={S.label}>지역</label>
          <input
            style={S.input}
            value={buyerRegion}
            onChange={(e) => setBuyerRegion(e.target.value)}
            placeholder="예: 충남 논산"
          />

          <label style={S.label}>주요 작물</label>
          <input
            style={S.input}
            value={mainCrop}
            onChange={(e) => setMainCrop(e.target.value)}
            placeholder="예: 마늘, 고추, 딸기"
          />

          <div style={S.sectionTitle}>주문 정보</div>

          <label style={S.label}>재배평수</label>
          <input
            style={S.input}
            value={formatArea(farmArea)}
            onChange={(e) => {
              const area = parseArea(e.target.value);
              setFarmArea(area);
              setQuantity(calculateQuantity(area, coveragePerUnit));
            }}
            placeholder="예: 300평"
            inputMode="numeric"
          />

          <div style={S.areaGuide}>
            1병 기준 {baseCoverage.toLocaleString("ko-KR")}평 · 재배평수 입력 시
            주문량이 자동 계산됩니다.
          </div>

          <label style={S.label}>주문량</label>
          <div style={S.quantityRow}>
            <input style={S.quantityInput} value={quantity} readOnly />
            <span style={S.unit}>병</span>
          </div>

          <label style={S.label}>문의 내용 선택</label>
          <textarea
            style={S.textarea}
            value={buyerMemo}
            onChange={(e) => setBuyerMemo(e.target.value)}
            placeholder="예: 총채벌레가 심합니다 / 사용 방법도 상담받고 싶습니다"
          />

          {purchaseUrl ? (
            <div style={S.externalNotice}>
              외부 쇼핑몰 링크가 있는 상품이지만, 현재는 K-Agri Expo 신청 접수
              기준으로 처리됩니다.
            </div>
          ) : null}

          {error ? <div style={S.error}>{error}</div> : null}
          {message ? <div style={S.success}>{message}</div> : null}

          <button
            type="button"
            style={saving ? S.disabledBtn : S.submitBtn}
            disabled={saving}
            onClick={submitOrder}
          >
            {saving ? "접수 중..." : "신청 접수하기"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  box: {
    marginTop: 16,
  },
  buyBtn: {
    width: "100%",
    minHeight: 56,
    border: "none",
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    fontSize: 20,
    fontWeight: 950,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  formBox: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
  },
  title: {
    fontSize: 20,
    fontWeight: 950,
    marginBottom: 10,
    color: "#0f172a",
  },
  autoNotice: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  },
  promoTitle: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 950,
    color: "#1e3a8a",
    lineHeight: 1.6,
  },
  promoText: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 800,
    color: "#334155",
    lineHeight: 1.7,
  },
  condition: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1.6,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    paddingTop: 10,
    borderTop: "1px solid #dbeafe",
    fontSize: 15,
    fontWeight: 950,
    color: "#0f172a",
  },
  label: {
    display: "block",
    marginBottom: 5,
    fontSize: 13,
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    marginBottom: 10,
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
    color: "#0f172a",
    WebkitTextFillColor: "#0f172a",
  },
  areaGuide: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 900,
    color: "#166534",
  },
  phonePreview: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 900,
    color: "#166534",
  },
  quantityRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  quantityInput: {
    width: 90,
    height: 42,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: 18,
    fontWeight: 950,
    textAlign: "center",
    boxSizing: "border-box",
    background: "#fff",
    color: "#0f172a",
    WebkitTextFillColor: "#0f172a",
  },
  unit: {
    fontSize: 15,
    fontWeight: 950,
    color: "#334155",
  },
  textarea: {
    width: "100%",
    minHeight: 86,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
    color: "#0f172a",
    WebkitTextFillColor: "#0f172a",
  },
  externalNotice: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#475569",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  submitBtn: {
    width: "100%",
    height: 52,
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  disabledBtn: {
    width: "100%",
    height: 52,
    border: "none",
    borderRadius: 12,
    background: "#94a3b8",
    color: "#fff",
    fontSize: 17,
    fontWeight: 950,
    cursor: "not-allowed",
  },
  error: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 900,
  },
  success: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
  },
};