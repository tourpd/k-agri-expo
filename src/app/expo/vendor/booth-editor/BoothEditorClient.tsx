"use client";

import React, { useMemo, useState } from "react";

type VendorShape = {
  user_id?: string;
  vendor_id?: string;
  company_name?: string;
  approval_status?: string;
};

type BoothShape = {
  booth_id?: string;
  vendor_id?: string;
  vendor_user_id?: string;

  name?: string;
  title?: string;
  intro?: string;
  description?: string;

  category_primary?: string;
  category_secondary?: string;

  hall_id?: string;
  slot_code?: string;

  contact_name?: string;
  email?: string;
  website_url?: string;

  logo_url?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  banner_url?: string;

  youtube_url?: string;
  video_url?: string;
  youtube_link?: string;

  booth_type?: string;
  plan_type?: string;

  is_public?: boolean;
  is_active?: boolean;
  is_published?: boolean;
  status?: string;
};

type ProductShape = {
  id?: string | number;
  product_id?: string | number;
  booth_id?: string;

  name?: string;
  title?: string;
  description?: string;

  image_url?: string;
  image_file_url?: string;
  thumbnail_url?: string;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string;

  youtube_url?: string;

  catalog_url?: string;
  catalog_file_url?: string;
  catalog_filename?: string;

  headline_text?: string;
  urgency_text?: string;
  cta_text?: string;

  point_1?: string;
  point_2?: string;
  point_3?: string;

  // 구매 / 모집 / 바이어
  purchase_url?: string;
  dealer_apply_url?: string;
  buyer_apply_url?: string;

  // 사용 가이드
  usage_summary?: string;
  usage_method?: string;
  usage_timing?: string;
  usage_interval?: string;
  usage_crops?: string;
  caution_text?: string;

  // 계산기 기준
  calc_base_water_liter?: number | null;
  calc_base_product_ml?: number | null;
  calc_base_area_pyeong?: number | null;

  is_active?: boolean;
  status?: string;
  sort_order?: number | null;
};

type BoothEditorClientProps = {
  vendor: VendorShape;
  booth: BoothShape;
  initialProducts: ProductShape[];
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function trimmed(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function boolOn(v: boolean | undefined, defaultValue = true) {
  return typeof v === "boolean" ? v : defaultValue;
}

function normalizeHallId(v?: string) {
  const hall = trimmed(v, "");
  if (!hall) return "";
  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";
  return hall;
}

function normalizeSlotCode(v?: string) {
  const slot = trimmed(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function hallLabel(v?: string) {
  const hall = normalizeHallId(v);
  if (!hall) return "-";
  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";
  return hall;
}

function formatMoney(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
}

function toNullableNumber(v: string) {
  const digits = (v || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function discountPercent(product: ProductShape) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > 0 &&
    product.sale_price_krw < product.price_krw
  ) {
    return Math.round(
      ((product.price_krw - product.sale_price_krw) / product.price_krw) * 100
    );
  }
  return null;
}

function productKeyOf(item: ProductShape) {
  return String(item.product_id ?? item.id ?? "");
}

function productDisplayName(item: ProductShape) {
  return trimmed(item.name, "") || trimmed(item.title, "") || "제품명 없음";
}

function emptyProduct(boothId: string): ProductShape {
  return {
    booth_id: boothId,
    name: "",
    title: "",
    description: "",
    image_url: "",
    price_krw: null,
    sale_price_krw: null,
    price_text: "",
    youtube_url: "",
    catalog_url: "",
    catalog_file_url: "",
    catalog_filename: "",
    headline_text: "",
    urgency_text: "",
    cta_text: "지금 구매하기",

    purchase_url: "",
    dealer_apply_url: "",
    buyer_apply_url: "",

    usage_summary: "",
    usage_method: "",
    usage_timing: "",
    usage_interval: "",
    usage_crops: "",
    caution_text: "",

    calc_base_water_liter: 500,
    calc_base_product_ml: 500,
    calc_base_area_pyeong: null,

    point_1: "",
    point_2: "",
    point_3: "",
    is_active: true,
    status: "active",
    sort_order: null,
  };
}

function normalizeProducts(rows: ProductShape[]) {
  return [...(rows ?? [])]
    .filter((row) => row.is_active !== false)
    .sort((a, b) => {
      const aOrder =
        typeof a.sort_order === "number" && Number.isFinite(a.sort_order)
          ? a.sort_order
          : 9999;
      const bOrder =
        typeof b.sort_order === "number" && Number.isFinite(b.sort_order)
          ? b.sort_order
          : 9999;
      return aOrder - bOrder;
    });
}

const RESPONSIVE_CSS = `
.booth-editor-root * {
  box-sizing: border-box;
}
.booth-editor-root input,
.booth-editor-root textarea,
.booth-editor-root button {
  font: inherit;
}
.booth-editor-root input,
.booth-editor-root textarea {
  word-break: keep-all;
}
@media (max-width: 900px) {
  .booth-grid-2 {
    grid-template-columns: 1fr !important;
  }
  .booth-grid-3 {
    grid-template-columns: 1fr !important;
  }
}
`;

export default function BoothEditorClient({
  vendor,
  booth,
  initialProducts,
}: BoothEditorClientProps) {
  const [form, setForm] = useState<BoothShape>({
    ...booth,
    name:
      trimmed(booth.name, "") ||
      trimmed(booth.title, "") ||
      trimmed(vendor.company_name, ""),
    title:
      trimmed(booth.title, "") ||
      trimmed(booth.name, "") ||
      trimmed(vendor.company_name, ""),
    intro: trimmed(booth.intro, ""),
    description: trimmed(booth.description, ""),
    contact_name: trimmed(booth.contact_name, ""),
    email: trimmed(booth.email, ""),
    website_url: trimmed(booth.website_url, ""),
    category_primary: trimmed(booth.category_primary, ""),
    category_secondary: trimmed(booth.category_secondary, ""),
    hall_id: normalizeHallId(booth.hall_id),
    slot_code: normalizeSlotCode(booth.slot_code),
    youtube_url:
      trimmed(booth.youtube_url, "") ||
      trimmed(booth.video_url, "") ||
      trimmed(booth.youtube_link, ""),
    is_public: boolOn(booth.is_public, false),
    is_active: boolOn(booth.is_active, true),
    is_published: boolOn(booth.is_published, false),
    plan_type: trimmed(booth.plan_type, "free"),
    cover_image_url:
      trimmed(booth.cover_image_url, "") ||
      trimmed(booth.banner_url, "") ||
      trimmed(booth.thumbnail_url, ""),
    logo_url: trimmed(booth.logo_url, ""),
  });

  const [products, setProducts] = useState<ProductShape[]>(
    normalizeProducts(initialProducts ?? [])
  );

  const [savingBooth, setSavingBooth] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [productError, setProductError] = useState("");

  const [productForm, setProductForm] = useState<ProductShape>(
    emptyProduct(trimmed(booth.booth_id, ""))
  );

  const isEditMode = !!productKeyOf(productForm);

  const boothName = useMemo(() => {
    return trimmed(form.name, "") || trimmed(form.title, "") || "부스명 미입력";
  }, [form.name, form.title]);

  function setField<K extends keyof BoothShape>(key: K, value: BoothShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setProductField<K extends keyof ProductShape>(
    key: K,
    value: ProductShape[K]
  ) {
    setProductForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetProductForm() {
    setProductForm(emptyProduct(trimmed(form.booth_id, "")));
    setProductMessage("");
    setProductError("");
  }

  function fillUsageTemplate() {
    setProductForm((prev) => ({
      ...prev,
      usage_summary:
        prev.usage_summary || "물 500L 기준 제품 500ml 1병",
      usage_method:
        prev.usage_method ||
        "물에 충분히 희석한 뒤 작물 전체에 고르게 살포하십시오.",
      usage_timing:
        prev.usage_timing || "병해충 초기 또는 작물 스트레스 시작 시 사용",
      usage_interval:
        prev.usage_interval || "7~10일 간격으로 작물 상태를 보며 사용",
      usage_crops:
        prev.usage_crops || "고추 / 딸기 / 오이 / 엽채류",
      caution_text:
        prev.caution_text || "고온 시간대 살포는 피하고 혼용 전 테스트를 권장합니다.",
      calc_base_water_liter: prev.calc_base_water_liter ?? 500,
      calc_base_product_ml: prev.calc_base_product_ml ?? 500,
    }));
  }

  function fillDealerTemplate() {
    setProductForm((prev) => ({
      ...prev,
      dealer_apply_url: prev.dealer_apply_url || "/expo/partner/dealer",
      buyer_apply_url: prev.buyer_apply_url || "/expo/partner/buyer",
    }));
  }

  function startEditProduct(item: ProductShape) {
    setProductForm({
      ...emptyProduct(trimmed(form.booth_id, "")),
      ...item,
      booth_id: trimmed(form.booth_id, ""),
      name: trimmed(item.name, ""),
      title: trimmed(item.title, ""),
      description: trimmed(item.description, ""),
      image_url: trimmed(item.image_url, ""),
      price_text: trimmed(item.price_text, ""),
      youtube_url: trimmed(item.youtube_url, ""),
      catalog_url: trimmed(item.catalog_url, ""),
      catalog_file_url: trimmed(item.catalog_file_url, ""),
      catalog_filename: trimmed(item.catalog_filename, ""),
      headline_text: trimmed(item.headline_text, ""),
      urgency_text: trimmed(item.urgency_text, ""),
      cta_text: trimmed(item.cta_text, "지금 구매하기"),

      purchase_url: trimmed(item.purchase_url, ""),
      dealer_apply_url: trimmed(item.dealer_apply_url, ""),
      buyer_apply_url: trimmed(item.buyer_apply_url, ""),

      usage_summary: trimmed(item.usage_summary, ""),
      usage_method: trimmed(item.usage_method, ""),
      usage_timing: trimmed(item.usage_timing, ""),
      usage_interval: trimmed(item.usage_interval, ""),
      usage_crops: trimmed(item.usage_crops, ""),
      caution_text: trimmed(item.caution_text, ""),

      point_1: trimmed(item.point_1, ""),
      point_2: trimmed(item.point_2, ""),
      point_3: trimmed(item.point_3, ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveBooth(e: React.FormEvent) {
    e.preventDefault();
    if (savingBooth) return;

    setSavingBooth(true);
    setError("");
    setMessage("");

    try {
      const boothId = trimmed(form.booth_id, "");
      if (!boothId) {
        throw new Error("booth_id가 없습니다. 먼저 운영자 쪽에서 부스가 생성되어 있어야 합니다.");
      }

      const payload = {
        booth_id: boothId,
        boothId,
        name: trimmed(form.name, "") || trimmed(vendor.company_name, ""),
        title: trimmed(form.title, "") || trimmed(form.name, ""),
        intro: safe(form.intro, ""),
        description: safe(form.description, ""),
        category_primary: safe(form.category_primary, ""),
        category_secondary: safe(form.category_secondary, ""),
        contact_name: safe(form.contact_name, ""),
        email: safe(form.email, ""),
        website_url: safe(form.website_url, ""),
        logo_url: safe(form.logo_url, ""),
        cover_image_url: safe(form.cover_image_url, ""),
        thumbnail_url: safe(form.cover_image_url || form.thumbnail_url, ""),
        banner_url: safe(form.cover_image_url || form.banner_url, ""),
        youtube_url: safe(form.youtube_url, ""),
        hall_id: normalizeHallId(form.hall_id),
        slot_code: normalizeSlotCode(form.slot_code),
        is_public: form.is_public === true,
        is_active: true,
        is_published: form.is_public === true,
        status: form.is_public ? "published" : "draft",
      };

      const res = await fetch("/api/vendor/booth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "부스 저장에 실패했습니다.");
      }

      setForm((prev) => ({
        ...prev,
        ...payload,
      }));
      setMessage("부스 정보가 저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "부스 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBooth(false);
    }
  }

  async function handleSaveProduct() {
    if (savingProduct) return;

    const boothId = trimmed(form.booth_id, "");
    if (!boothId) {
      setProductError("먼저 부스를 저장해 주세요.");
      return;
    }

    if (!trimmed(productForm.name, "") && !trimmed(productForm.title, "")) {
      setProductError("제품명 또는 제품 제목을 입력해 주세요.");
      return;
    }

    if (!trimmed(productForm.purchase_url, "")) {
      setProductError("구매하기 링크를 넣어주셔야 합니다. 전화상담 없이 구매 전환 구조로 갑니다.");
      return;
    }

    setSavingProduct(true);
    setProductError("");
    setProductMessage("");

    try {
      const payload = {
        product_id: productForm.product_id ?? productForm.id ?? undefined,
        booth_id: boothId,
        boothId,

        name: safe(productForm.name, ""),
        title: safe(productForm.title, ""),
        description: safe(productForm.description, ""),

        image_url: safe(productForm.image_url, ""),
        image_file_url: safe(productForm.image_url || productForm.image_file_url, ""),
        thumbnail_url: safe(productForm.image_url || productForm.thumbnail_url, ""),

        price_krw:
          typeof productForm.price_krw === "number" ? productForm.price_krw : null,
        sale_price_krw:
          typeof productForm.sale_price_krw === "number"
            ? productForm.sale_price_krw
            : null,
        price_text: safe(productForm.price_text, ""),

        youtube_url: safe(productForm.youtube_url, ""),
        catalog_url: safe(productForm.catalog_url, ""),
        catalog_file_url: safe(productForm.catalog_file_url, ""),
        catalog_filename: safe(productForm.catalog_filename, ""),

        headline_text: safe(productForm.headline_text, ""),
        urgency_text: safe(productForm.urgency_text, ""),
        cta_text: safe(productForm.cta_text, "지금 구매하기"),

        purchase_url: safe(productForm.purchase_url, ""),
        dealer_apply_url: safe(productForm.dealer_apply_url, ""),
        buyer_apply_url: safe(productForm.buyer_apply_url, ""),

        usage_summary: safe(productForm.usage_summary, ""),
        usage_method: safe(productForm.usage_method, ""),
        usage_timing: safe(productForm.usage_timing, ""),
        usage_interval: safe(productForm.usage_interval, ""),
        usage_crops: safe(productForm.usage_crops, ""),
        caution_text: safe(productForm.caution_text, ""),

        calc_base_water_liter:
          typeof productForm.calc_base_water_liter === "number"
            ? productForm.calc_base_water_liter
            : null,
        calc_base_product_ml:
          typeof productForm.calc_base_product_ml === "number"
            ? productForm.calc_base_product_ml
            : null,
        calc_base_area_pyeong:
          typeof productForm.calc_base_area_pyeong === "number"
            ? productForm.calc_base_area_pyeong
            : null,

        point_1: safe(productForm.point_1, ""),
        point_2: safe(productForm.point_2, ""),
        point_3: safe(productForm.point_3, ""),

        is_active: productForm.is_active !== false,
        status: "active",
        sort_order:
          typeof productForm.sort_order === "number"
            ? productForm.sort_order
            : null,
      };

      const res = await fetch("/api/vendor/products/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.item) {
        throw new Error(json?.error || "제품 저장에 실패했습니다.");
      }

      const saved = json.item as ProductShape;
      const savedKey = productKeyOf(saved);

      setProducts((prev) => {
        const exists = prev.some((row) => productKeyOf(row) === savedKey);
        const next = exists
          ? prev.map((row) => (productKeyOf(row) === savedKey ? saved : row))
          : [saved, ...prev];
        return normalizeProducts(next);
      });

      resetProductForm();
      setProductMessage(isEditMode ? "제품이 수정되었습니다." : "제품이 등록되었습니다.");
    } catch (e) {
      setProductError(e instanceof Error ? e.message : "제품 저장에 실패했습니다.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(item: ProductShape) {
    const key = productKeyOf(item);
    if (!key) return;

    const ok = window.confirm(`"${productDisplayName(item)}" 제품을 삭제하시겠습니까?`);
    if (!ok) return;

    setDeletingKey(key);
    setProductError("");
    setProductMessage("");

    try {
      const res = await fetch("/api/vendor/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: item.product_id ?? item.id,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "제품 삭제에 실패했습니다.");
      }

      setProducts((prev) => prev.filter((row) => productKeyOf(row) !== key));

      if (productKeyOf(productForm) === key) {
        resetProductForm();
      }

      setProductMessage("제품이 삭제되었습니다.");
    } catch (e) {
      setProductError(e instanceof Error ? e.message : "제품 삭제 실패");
    } finally {
      setDeletingKey("");
    }
  }

  return (
    <main style={S.page} className="booth-editor-root">
      <style>{RESPONSIVE_CSS}</style>

      <section style={S.hero}>
        <div style={S.eyebrow}>VENDOR SALES EDITOR</div>
        <h1 style={S.heroTitle}>{boothName}</h1>
        <div style={S.heroDesc}>
          이제 이 화면은 단순 문의형이 아니라
          <b> 구매형 + 대리점 모집형 + 바이어 연결형 </b>
          구조로 운영합니다.
          전화상담은 넣지 않고, 구매와 신청 링크 중심으로 설계합니다.
        </div>
      </section>

      <section style={S.summaryRow}>
        <div style={S.summaryCard}>
          <div style={S.summaryLabel}>업체명</div>
          <div style={S.summaryValue}>{trimmed(vendor.company_name, "업체명 미입력")}</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryLabel}>전시장</div>
          <div style={S.summaryValue}>{hallLabel(form.hall_id)}</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryLabel}>부스 위치</div>
          <div style={S.summaryValue}>{normalizeSlotCode(form.slot_code)}</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryLabel}>등록 제품 수</div>
          <div style={S.summaryValue}>{products.length}개</div>
        </div>
      </section>

      <form onSubmit={handleSaveBooth} style={S.card}>
        <div style={S.sectionTitle}>1. 부스 기본 정보</div>
        <div style={S.sectionDesc}>
          농민이 보고 바로 이해할 수 있게, 어렵고 긴 회사 소개보다 판매 중심 설명으로 씁니다.
        </div>

        <div style={S.grid2} className="booth-grid-2">
          <label style={S.labelWrap}>
            <div style={S.label}>부스명</div>
            <input
              style={S.input}
              value={safe(form.name, "")}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="예: DOF 작물별 특가관"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>부스 한줄 제목</div>
            <input
              style={S.input}
              value={safe(form.title, "")}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="예: 농민 구매 / 대리점 모집 / 바이어 연결"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대표 담당자명</div>
            <input
              style={S.input}
              value={safe(form.contact_name, "")}
              onChange={(e) => setField("contact_name", e.target.value)}
              placeholder="담당자명"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>상담 이메일</div>
            <input
              style={S.input}
              value={safe(form.email, "")}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="이메일 문의만 받기"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대표 카테고리</div>
            <input
              style={S.input}
              value={safe(form.category_primary, "")}
              onChange={(e) => setField("category_primary", e.target.value)}
              placeholder="예: 비료 / 영양제 / 친환경 자재"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>세부 카테고리</div>
            <input
              style={S.input}
              value={safe(form.category_secondary, "")}
              onChange={(e) => setField("category_secondary", e.target.value)}
              placeholder="예: 활착제 / 칼슘제 / 살충제"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대표 유튜브 링크</div>
            <input
              style={S.input}
              value={safe(form.youtube_url, "")}
              onChange={(e) => setField("youtube_url", e.target.value)}
              placeholder="대표 소개 영상 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>홈페이지 링크</div>
            <input
              style={S.input}
              value={safe(form.website_url, "")}
              onChange={(e) => setField("website_url", e.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>짧은 소개</div>
          <textarea
            style={S.textareaSmall}
            value={safe(form.intro, "")}
            onChange={(e) => setField("intro", e.target.value)}
            placeholder="예: 농민은 바로 구매하고, 대리점은 공급 조건을 보고, 바이어는 대량 문의할 수 있는 전용 부스입니다."
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>상세 소개</div>
          <textarea
            style={S.textarea}
            value={safe(form.description, "")}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="예: 대표 제품 소개, 어떤 작물에 좋은지, 사용 시기, 구매 흐름, 대리점 모집 조건, 바이어 연결 내용을 쉽게 적어주세요."
          />
        </label>

        <div style={S.infoBox}>
          현재 위치: <b>{hallLabel(form.hall_id)}</b> / <b>{normalizeSlotCode(form.slot_code)}</b>
          <br />
          전화상담 버튼은 만들지 않습니다. 이메일 / 구매링크 / 신청링크 중심으로 갑니다.
        </div>

        <div style={S.toggleRow}>
          <button
            type="button"
            style={form.is_public ? S.toggleOn : S.toggleOff}
            onClick={() => setField("is_public", !form.is_public)}
          >
            {form.is_public ? "부스 공개 ON" : "부스 공개 OFF"}
          </button>
        </div>

        {error ? <div style={S.error}>{error}</div> : null}
        {message ? <div style={S.success}>{message}</div> : null}

        <div style={S.submitRow}>
          <button
            type="submit"
            disabled={savingBooth}
            style={savingBooth ? S.submitDisabled : S.submitBtn}
          >
            {savingBooth ? "저장 중..." : "부스 저장하기"}
          </button>
        </div>
      </form>

      <section style={S.card}>
        <div style={S.sectionTitle}>2. 제품 등록 / 수정</div>
        <div style={S.sectionDesc}>
          제품은 이제 단순 소개가 아니라, 바로 구매 / 대리점 모집 / 바이어 연결 / 사용법 안내까지 함께 넣습니다.
        </div>

        <div style={S.productTopRow}>
          <div style={S.productEditorTitle}>
            {isEditMode ? "제품 수정 중" : "새 제품 등록"}
          </div>

          <div style={S.productTopBtns}>
            <button type="button" style={S.secondaryBtn} onClick={fillUsageTemplate}>
              사용법 예시 넣기
            </button>
            <button type="button" style={S.secondaryBtn} onClick={fillDealerTemplate}>
              대리점/바이어 링크 예시 넣기
            </button>
            <button type="button" style={S.secondaryBtn} onClick={resetProductForm}>
              새로 쓰기
            </button>
          </div>
        </div>

        <div style={S.grid2} className="booth-grid-2">
          <label style={S.labelWrap}>
            <div style={S.label}>제품명</div>
            <input
              style={S.input}
              value={safe(productForm.name, "")}
              onChange={(e) => setProductField("name", e.target.value)}
              placeholder="예: 싹쓰리충"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>제품 한줄 제목</div>
            <input
              style={S.input}
              value={safe(productForm.title, "")}
              onChange={(e) => setProductField("title", e.target.value)}
              placeholder="예: 총채벌레 초기 방제 핵심 제품"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>정가</div>
            <input
              style={S.input}
              value={formatMoney(productForm.price_krw)}
              onChange={(e) => setProductField("price_krw", toNullableNumber(e.target.value))}
              placeholder="예: 70,000원"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>행사가</div>
            <input
              style={S.input}
              value={formatMoney(productForm.sale_price_krw)}
              onChange={(e) => setProductField("sale_price_krw", toNullableNumber(e.target.value))}
              placeholder="예: 59,000원"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>구매하기 링크</div>
            <input
              style={S.input}
              value={safe(productForm.purchase_url, "")}
              onChange={(e) => setProductField("purchase_url", e.target.value)}
              placeholder="가장 중요합니다. 실제 구매 페이지 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>제품 영상 링크</div>
            <input
              style={S.input}
              value={safe(productForm.youtube_url, "")}
              onChange={(e) => setProductField("youtube_url", e.target.value)}
              placeholder="유튜브 또는 영상 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대리점 신청 링크</div>
            <input
              style={S.input}
              value={safe(productForm.dealer_apply_url, "")}
              onChange={(e) => setProductField("dealer_apply_url", e.target.value)}
              placeholder="농약방 / 대리점 모집용 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>바이어 문의 링크</div>
            <input
              style={S.input}
              value={safe(productForm.buyer_apply_url, "")}
              onChange={(e) => setProductField("buyer_apply_url", e.target.value)}
              placeholder="대량구매 / 수출 / 바이어용 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>제품 이미지 URL</div>
            <input
              style={S.input}
              value={safe(productForm.image_url, "")}
              onChange={(e) => setProductField("image_url", e.target.value)}
              placeholder="제품 이미지 주소"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>카탈로그 파일 URL</div>
            <input
              style={S.input}
              value={safe(productForm.catalog_file_url, "")}
              onChange={(e) => setProductField("catalog_file_url", e.target.value)}
              placeholder="PDF 또는 자료 링크"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>강조 문구</div>
            <input
              style={S.input}
              value={safe(productForm.headline_text, "")}
              onChange={(e) => setProductField("headline_text", e.target.value)}
              placeholder="예: 총채벌레 초기 대응 추천"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>행사 배지 문구</div>
            <input
              style={S.input}
              value={safe(productForm.urgency_text, "")}
              onChange={(e) => setProductField("urgency_text", e.target.value)}
              placeholder="예: 박람회 특가 / 대리점 모집중 / 바이어 상담"
            />
          </label>
        </div>

        <div style={S.priceBox}>
          <div style={S.priceCard}>
            <div style={S.priceLabel}>정가</div>
            <div style={S.priceValue}>{formatMoney(productForm.price_krw) || "-"}</div>
          </div>
          <div style={S.priceCard}>
            <div style={S.priceLabel}>행사가</div>
            <div style={S.priceValueStrong}>{formatMoney(productForm.sale_price_krw) || "-"}</div>
          </div>
          <div style={S.priceCardStrong}>
            <div style={S.priceLabel}>할인율</div>
            <div style={S.discountValue}>
              {discountPercent(productForm) !== null ? `${discountPercent(productForm)}% 할인` : "-"}
            </div>
          </div>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>제품 설명</div>
          <textarea
            style={S.textarea}
            value={safe(productForm.description, "")}
            onChange={(e) => setProductField("description", e.target.value)}
            placeholder="제품 특징 / 장점 / 어떤 농가에 맞는지 쉽게 적어주세요."
          />
        </label>

        <div style={S.grid3} className="booth-grid-3">
          <label style={S.labelWrap}>
            <div style={S.label}>핵심 포인트 1</div>
            <input
              style={S.input}
              value={safe(productForm.point_1, "")}
              onChange={(e) => setProductField("point_1", e.target.value)}
              placeholder="예: 활착 촉진"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>핵심 포인트 2</div>
            <input
              style={S.input}
              value={safe(productForm.point_2, "")}
              onChange={(e) => setProductField("point_2", e.target.value)}
              placeholder="예: 초기 생육 회복"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>핵심 포인트 3</div>
            <input
              style={S.input}
              value={safe(productForm.point_3, "")}
              onChange={(e) => setProductField("point_3", e.target.value)}
              placeholder="예: 스트레스 완화"
            />
          </label>
        </div>

        <div style={S.subSectionTitle}>3. 사용방법 / 사용량 계산 기준</div>
        <div style={S.sectionDesc}>
          농민이 가장 궁금해하는 내용입니다. 여기 잘 넣어야 문의가 줄고 구매가 늘어납니다.
        </div>

        <div style={S.grid2} className="booth-grid-2">
          <label style={S.labelWrap}>
            <div style={S.label}>사용 요약</div>
            <input
              style={S.input}
              value={safe(productForm.usage_summary, "")}
              onChange={(e) => setProductField("usage_summary", e.target.value)}
              placeholder="예: 물 500L 기준 제품 500ml 1병"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>사용 가능 작물</div>
            <input
              style={S.input}
              value={safe(productForm.usage_crops, "")}
              onChange={(e) => setProductField("usage_crops", e.target.value)}
              placeholder="예: 고추 / 딸기 / 오이 / 엽채류"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>사용 시기</div>
            <input
              style={S.input}
              value={safe(productForm.usage_timing, "")}
              onChange={(e) => setProductField("usage_timing", e.target.value)}
              placeholder="예: 병해충 초기 / 정식 후 / 활착기"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>사용 간격</div>
            <input
              style={S.input}
              value={safe(productForm.usage_interval, "")}
              onChange={(e) => setProductField("usage_interval", e.target.value)}
              placeholder="예: 7~10일 간격"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 물량(L)</div>
            <input
              style={S.input}
              value={productForm.calc_base_water_liter ?? ""}
              onChange={(e) =>
                setProductField("calc_base_water_liter", toNullableNumber(e.target.value))
              }
              placeholder="예: 500"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 약량(ml)</div>
            <input
              style={S.input}
              value={productForm.calc_base_product_ml ?? ""}
              onChange={(e) =>
                setProductField("calc_base_product_ml", toNullableNumber(e.target.value))
              }
              placeholder="예: 500"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 면적(평, 선택)</div>
            <input
              style={S.input}
              value={productForm.calc_base_area_pyeong ?? ""}
              onChange={(e) =>
                setProductField("calc_base_area_pyeong", toNullableNumber(e.target.value))
              }
              placeholder="선택값"
              inputMode="numeric"
            />
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>사용 방법 상세</div>
          <textarea
            style={S.textareaSmall}
            value={safe(productForm.usage_method, "")}
            onChange={(e) => setProductField("usage_method", e.target.value)}
            placeholder="예: 물에 충분히 희석 후 작물 전체에 고르게 살포하십시오."
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>주의사항</div>
          <textarea
            style={S.textareaSmall}
            value={safe(productForm.caution_text, "")}
            onChange={(e) => setProductField("caution_text", e.target.value)}
            placeholder="예: 고온 시간대 살포 주의 / 혼용 전 테스트 권장"
          />
        </label>

        <div style={S.infoBox}>
          예시 계산:
          <br />
          기준이 <b>물 {productForm.calc_base_water_liter ?? "-"}L</b> 에
          <b> 제품 {productForm.calc_base_product_ml ?? "-"}ml</b> 라면,
          농민은 자기 물 사용량만 넣어서 몇 병 필요한지 계산할 수 있게 됩니다.
        </div>

        {productError ? <div style={S.error}>{productError}</div> : null}
        {productMessage ? <div style={S.success}>{productMessage}</div> : null}

        <div style={S.submitRow}>
          <button
            type="button"
            disabled={savingProduct}
            style={savingProduct ? S.submitDisabled : S.productSaveBtn}
            onClick={handleSaveProduct}
          >
            {savingProduct ? "저장 중..." : isEditMode ? "제품 수정 저장" : "제품 등록 저장"}
          </button>
        </div>
      </section>

      <section style={S.card}>
        <div style={S.sectionTitle}>3. 등록된 제품 목록</div>

        {products.length === 0 ? (
          <div style={S.emptyBox}>아직 등록된 제품이 없습니다.</div>
        ) : (
          <div style={S.productListGrid}>
            {products.map((item, idx) => {
              const key = String(item.product_id ?? item.id ?? idx);
              const deleting = deletingKey === key;

              return (
                <div key={key} style={S.productItemCard}>
                  <div style={S.productItemName}>{productDisplayName(item)}</div>

                  <div style={S.productItemPriceRow}>
                    <div style={S.productItemPriceStrong}>
                      {formatMoney(item.sale_price_krw) || item.price_text || "가격 문의"}
                    </div>
                    {item.price_krw ? (
                      <div style={S.productItemPriceOld}>{formatMoney(item.price_krw)}</div>
                    ) : null}
                  </div>

                  <div style={S.productItemDesc}>
                    {trimmed(item.usage_summary, "") ||
                      trimmed(item.headline_text, "") ||
                      trimmed(item.description, "") ||
                      "설명 없음"}
                  </div>

                  <div style={S.productActionRow}>
                    <button type="button" style={S.secondaryBtn} onClick={() => startEditProduct(item)}>
                      수정
                    </button>
                    <button
                      type="button"
                      style={deleting ? S.deleteBtnDisabled : S.deleteBtn}
                      disabled={deleting}
                      onClick={() => handleDeleteProduct(item)}
                    >
                      {deleting ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    background: "#f8fafc",
    minHeight: "100vh",
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    color: "#fff",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#86efac",
    letterSpacing: 0.4,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1.2,
    fontWeight: 950,
  },
  heroDesc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.3,
    wordBreak: "keep-all",
  },
  card: {
    borderRadius: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#111827",
    marginBottom: 8,
  },
  subSectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  sectionDesc: {
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 1.85,
    color: "#64748b",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
  labelWrap: {
    display: "block",
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
  },
  textareaSmall: {
    width: "100%",
    minHeight: 100,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    lineHeight: 1.8,
    resize: "vertical",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    lineHeight: 1.9,
    resize: "vertical",
    outline: "none",
  },
  infoBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 700,
    whiteSpace: "pre-wrap",
  },
  toggleRow: {
    marginTop: 10,
    display: "flex",
  },
  toggleOn: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
    cursor: "pointer",
  },
  toggleOff: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 900,
    cursor: "pointer",
  },
  submitRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  submitBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  submitDisabled: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontSize: 15,
    fontWeight: 950,
    cursor: "not-allowed",
  },
  productTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  productEditorTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  productTopBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  secondaryBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  productSaveBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  priceBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  priceCard: {
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 14,
  },
  priceCardStrong: {
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff7ed",
    padding: 14,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  priceValueStrong: {
    fontSize: 26,
    fontWeight: 950,
    color: "#dc2626",
  },
  discountValue: {
    fontSize: 24,
    fontWeight: 950,
    color: "#dc2626",
  },
  productListGrid: {
    display: "grid",
    gap: 12,
  },
  productItemCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
  },
  productItemName: {
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  productItemPriceRow: {
    marginTop: 8,
    display: "flex",
    gap: 10,
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  productItemPriceStrong: {
    fontSize: 26,
    fontWeight: 950,
    color: "#dc2626",
  },
  productItemPriceOld: {
    fontSize: 13,
    fontWeight: 800,
    color: "#94a3b8",
    textDecoration: "line-through",
  },
  productItemDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  productActionRow: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  deleteBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtnDisabled: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#fca5a5",
    color: "#fff",
    fontWeight: 900,
    cursor: "not-allowed",
  },
  emptyBox: {
    padding: 16,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
  error: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  success: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
    lineHeight: 1.7,
  },
};