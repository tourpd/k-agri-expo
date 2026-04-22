"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type VendorProductPlanType = "free" | "basic" | "premium" | string;

export type VendorProductItem = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;

  name?: string | null;
  title?: string | null;
  description?: string | null;

  image_url?: string | null;
  image_file_url?: string | null;
  thumbnail_url?: string | null;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string | null;

  youtube_url?: string | null;

  catalog_url?: string | null;
  catalog_file_url?: string | null;
  catalog_filename?: string | null;

  headline_text?: string | null;
  urgency_text?: string | null;
  cta_text?: string | null;

  point_1?: string | null;
  point_2?: string | null;
  point_3?: string | null;

  is_active?: boolean | null;
  status?: string | null;
  sort_order?: number | null;
};

type Props = {
  boothId: string;
  planType?: VendorProductPlanType;
  initialProducts?: VendorProductItem[];
  onProductsChange?: (items: VendorProductItem[]) => void;
};

function safe(v: unknown, fallback = ""): string {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function normalizePlanType(v?: string | null): VendorProductPlanType {
  const plan = safe(v, "").toLowerCase();
  if (plan === "premium") return "premium";
  if (plan === "basic") return "basic";
  return "free";
}

function getPlanLimit(planType?: VendorProductPlanType): number {
  const plan = normalizePlanType(planType);
  if (plan === "premium") return 10;
  if (plan === "basic") return 3;
  return 1;
}

function getPlanLabel(planType?: VendorProductPlanType): string {
  const plan = normalizePlanType(planType);
  if (plan === "premium") return "프리미엄";
  if (plan === "basic") return "기본";
  return "무료";
}

function toNullableNumber(v: string): number | null {
  const s = v.trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function productKeyOf(item: VendorProductItem): string {
  return String(item.product_id ?? item.id ?? "");
}

function productImage(item: VendorProductItem): string {
  return (
    safe(item.image_file_url, "") ||
    safe(item.image_url, "") ||
    safe(item.thumbnail_url, "")
  );
}

function productPriceText(item: VendorProductItem): string {
  if (safe(item.price_text, "")) return safe(item.price_text, "");
  if (typeof item.sale_price_krw === "number") {
    return `${item.sale_price_krw.toLocaleString("ko-KR")}원`;
  }
  if (typeof item.price_krw === "number") {
    return `${item.price_krw.toLocaleString("ko-KR")}원`;
  }
  return "가격 문의";
}

function originalPriceText(item: VendorProductItem): string {
  if (
    typeof item.price_krw === "number" &&
    typeof item.sale_price_krw === "number" &&
    item.price_krw > item.sale_price_krw
  ) {
    return `${item.price_krw.toLocaleString("ko-KR")}원`;
  }
  return "";
}

function normalizeProducts(rows: VendorProductItem[]): VendorProductItem[] {
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

      if (aOrder !== bOrder) return aOrder - bOrder;

      return safe(a.name ?? a.title, "").localeCompare(
        safe(b.name ?? b.title, ""),
        "ko"
      );
    });
}

function createEmptyProduct(boothId: string): VendorProductItem {
  return {
    booth_id: boothId,
    name: "",
    title: "",
    description: "",
    image_url: "",
    image_file_url: "",
    thumbnail_url: "",
    price_krw: null,
    sale_price_krw: null,
    price_text: "",
    youtube_url: "",
    catalog_url: "",
    catalog_file_url: "",
    catalog_filename: "",
    headline_text: "",
    urgency_text: "",
    cta_text: "",
    point_1: "",
    point_2: "",
    point_3: "",
    is_active: true,
    status: "active",
    sort_order: null,
  };
}

async function uploadAsset(file: File, folder: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/vendor/assets/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success || !json?.file?.public_url) {
    throw new Error(json?.error || "파일 업로드에 실패했습니다.");
  }

  return json.file as {
    public_url: string;
    filename: string;
    path: string;
  };
}

const RESPONSIVE_CSS = `
.vendor-product-manager * {
  box-sizing: border-box;
}
@media (max-width: 900px) {
  .vendor-product-grid2 {
    grid-template-columns: 1fr !important;
  }
  .vendor-product-upload-row {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 640px) {
  .vendor-product-wrap {
    padding: 14px !important;
    border-radius: 18px !important;
  }
  .vendor-product-editor {
    padding: 14px !important;
  }
  .vendor-product-title {
    font-size: 20px !important;
  }
}
`;

export default function VendorProductManager({
  boothId,
  planType = "free",
  initialProducts = [],
  onProductsChange,
}: Props) {
  const [products, setProducts] = useState<VendorProductItem[]>(
    normalizeProducts(initialProducts)
  );
  const [form, setForm] = useState<VendorProductItem>(createEmptyProduct(boothId));
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploadingField, setUploadingField] = useState("");

  const imageRef = useRef<HTMLInputElement | null>(null);
  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const thumbRef = useRef<HTMLInputElement | null>(null);
  const catalogRef = useRef<HTMLInputElement | null>(null);

  const normalizedPlan = normalizePlanType(planType);
  const planLimit = getPlanLimit(normalizedPlan);
  const productCount = products.length;
  const isEditMode = !!productKeyOf(form);
  const canCreateMore = isEditMode || productCount < planLimit;

  useEffect(() => {
    setProducts(normalizeProducts(initialProducts));
  }, [initialProducts]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      booth_id: boothId,
    }));
  }, [boothId]);

  const remainingText = useMemo(() => {
    return `${productCount} / ${planLimit}개 등록`;
  }, [planLimit, productCount]);

  function syncProducts(next: VendorProductItem[]) {
    const normalized = normalizeProducts(next);
    setProducts(normalized);
    onProductsChange?.(normalized);
  }

  function setField<K extends keyof VendorProductItem>(
    key: K,
    value: VendorProductItem[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(createEmptyProduct(boothId));
    setNotice("");
    setError("");
  }

  function startEdit(item: VendorProductItem) {
    setForm({
      ...createEmptyProduct(boothId),
      ...item,
      booth_id: boothId,
      name: safe(item.name, ""),
      title: safe(item.title, ""),
      description: safe(item.description, ""),
      image_url: safe(item.image_url, ""),
      image_file_url: safe(item.image_file_url, ""),
      thumbnail_url: safe(item.thumbnail_url, ""),
      price_text: safe(item.price_text, ""),
      youtube_url: safe(item.youtube_url, ""),
      catalog_url: safe(item.catalog_url, ""),
      catalog_file_url: safe(item.catalog_file_url, ""),
      catalog_filename: safe(item.catalog_filename, ""),
      headline_text: safe(item.headline_text, ""),
      urgency_text: safe(item.urgency_text, ""),
      cta_text: safe(item.cta_text, ""),
      point_1: safe(item.point_1, ""),
      point_2: safe(item.point_2, ""),
      point_3: safe(item.point_3, ""),
      is_active: item.is_active !== false,
      status: safe(item.status, "active"),
      sort_order:
        typeof item.sort_order === "number" && Number.isFinite(item.sort_order)
          ? item.sort_order
          : null,
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUploadFile(
    file: File,
    target:
      | "image_url"
      | "image_file_url"
      | "thumbnail_url"
      | "catalog_file_url"
  ) {
    try {
      setUploadingField(target);
      setNotice("");
      setError("");

      const uploaded = await uploadAsset(
        file,
        target === "catalog_file_url" ? "product-catalogs" : "product-images"
      );

      setField(target, uploaded.public_url as VendorProductItem[typeof target]);

      if (target === "catalog_file_url") {
        setField("catalog_filename", uploaded.filename);
      }

      setNotice("파일 업로드가 완료되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일 업로드에 실패했습니다.");
    } finally {
      setUploadingField("");
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || uploadingField) return;

    if (!boothId) {
      setError("booth_id가 없어 제품을 저장할 수 없습니다.");
      return;
    }

    if (!canCreateMore) {
      setError(
        `현재 플랜(${getPlanLabel(normalizedPlan)})에서는 최대 ${planLimit}개까지 등록할 수 있습니다.`
      );
      return;
    }

    if (!safe(form.name, "") && !safe(form.title, "")) {
      setError("제품명 또는 제목 중 하나는 입력해야 합니다.");
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const payload = {
        product_id: form.product_id ?? form.id ?? undefined,
        booth_id: boothId,
        name: safe(form.name, ""),
        title: safe(form.title, ""),
        description: safe(form.description, ""),
        image_url: safe(form.image_url, ""),
        image_file_url: safe(form.image_file_url, ""),
        thumbnail_url: safe(form.thumbnail_url, ""),
        price_krw:
          typeof form.price_krw === "number" ? form.price_krw : null,
        sale_price_krw:
          typeof form.sale_price_krw === "number" ? form.sale_price_krw : null,
        price_text: safe(form.price_text, ""),
        youtube_url: safe(form.youtube_url, ""),
        catalog_url: safe(form.catalog_url, ""),
        catalog_file_url: safe(form.catalog_file_url, ""),
        catalog_filename: safe(form.catalog_filename, ""),
        headline_text: safe(form.headline_text, ""),
        urgency_text: safe(form.urgency_text, ""),
        cta_text: safe(form.cta_text, ""),
        point_1: safe(form.point_1, ""),
        point_2: safe(form.point_2, ""),
        point_3: safe(form.point_3, ""),
        is_active: form.is_active !== false,
        status: safe(form.status, "active"),
        sort_order:
          typeof form.sort_order === "number" && Number.isFinite(form.sort_order)
            ? form.sort_order
            : null,
      };

      const res = await fetch("/api/vendor/products/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.item) {
        throw new Error(json?.error || "제품 저장에 실패했습니다.");
      }

      const saved = json.item as VendorProductItem;
      const savedKey = productKeyOf(saved);

      let next: VendorProductItem[];
      const exists = products.some((item) => productKeyOf(item) === savedKey);

      if (exists) {
        next = products.map((item) =>
          productKeyOf(item) === savedKey ? saved : item
        );
      } else {
        next = [saved, ...products];
      }

      syncProducts(next);
      resetForm();
      setNotice(isEditMode ? "제품이 수정되었습니다." : "제품이 등록되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "제품 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: VendorProductItem) {
    const key = productKeyOf(item);
    if (!key) {
      setError("삭제할 제품 식별자가 없습니다.");
      return;
    }

    const ok = window.confirm(
      `"${safe(item.name ?? item.title, "이 제품")}"을(를) 삭제하시겠습니까?`
    );
    if (!ok) return;

    setDeletingKey(key);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/vendor/products/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: item.product_id ?? item.id,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "제품 삭제에 실패했습니다.");
      }

      const next = products.filter((row) => productKeyOf(row) !== key);
      syncProducts(next);

      if (productKeyOf(form) === key) {
        resetForm();
      }

      setNotice("제품이 삭제되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "제품 삭제에 실패했습니다.");
    } finally {
      setDeletingKey("");
    }
  }

  return (
    <section style={S.wrap} className="vendor-product-manager vendor-product-wrap">
      <style>{RESPONSIVE_CSS}</style>

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, "image_url");
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, "image_file_url");
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={thumbRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, "thumbnail_url");
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={catalogRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file, "catalog_file_url");
          e.currentTarget.value = "";
        }}
      />

      <div style={S.header}>
        <div>
          <div style={S.title} className="vendor-product-title">제품 관리</div>
          <div style={S.desc}>
            제품 추가, 수정, 삭제를 여기서 직접 처리합니다. 가격 혜택, 행사 문구,
            유튜브 영상, 이미지, 카탈로그를 함께 넣는 방식이 가장 강합니다.
          </div>
        </div>

        <div style={S.metaWrap}>
          <span style={S.planBadge}>플랜: {getPlanLabel(normalizedPlan)}</span>
          <span style={S.countBadge}>{remainingText}</span>
        </div>
      </div>

      {!canCreateMore && !isEditMode ? (
        <div style={S.limitBox}>
          현재 플랜에서는 제품을 더 등록할 수 없습니다. 플랜을 올리면 등록 가능 수량이 늘어납니다.
        </div>
      ) : null}

      <form onSubmit={handleSave} style={S.editorCard} className="vendor-product-editor">
        <div style={S.editorTop}>
          <div style={S.editorTitle}>
            {isEditMode ? "제품 수정" : "새 제품 등록"}
          </div>

          <button type="button" style={S.resetBtn} onClick={resetForm}>
            새로 작성
          </button>
        </div>

        <div style={S.templateRow}>
          <button
            type="button"
            style={S.templateChip}
            onClick={() => setField("urgency_text", "공동구매 진행중 / 수량 한정")}
          >
            공동구매 문구
          </button>
          <button
            type="button"
            style={S.templateChip}
            onClick={() => setField("urgency_text", "이번 주 특가 / 조기마감 가능")}
          >
            특가 문구
          </button>
          <button
            type="button"
            style={S.templateChip}
            onClick={() => setField("cta_text", "지금 문의하면 행사 조건을 바로 안내합니다")}
          >
            CTA 문구
          </button>
          <button
            type="button"
            style={S.templateChip}
            onClick={() => setField("headline_text", "농민이 바로 이해하는 핵심 판매 포인트")}
          >
            대표문구
          </button>
        </div>

        <div style={S.grid2} className="vendor-product-grid2">
          <label style={S.labelWrap}>
            <div style={S.label}>제품명</div>
            <input
              style={S.input}
              value={safe(form.name, "")}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="예: 켈팍"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>제품 제목</div>
            <input
              style={S.input}
              value={safe(form.title, "")}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="예: 활착과 초기 생육 회복"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>정가</div>
            <input
              style={S.input}
              value={form.price_krw ?? ""}
              onChange={(e) => setField("price_krw", toNullableNumber(e.target.value))}
              placeholder="숫자만"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>행사가</div>
            <input
              style={S.input}
              value={form.sale_price_krw ?? ""}
              onChange={(e) =>
                setField("sale_price_krw", toNullableNumber(e.target.value))
              }
              placeholder="숫자만"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>가격 문구</div>
            <input
              style={S.input}
              value={safe(form.price_text, "")}
              onChange={(e) => setField("price_text", e.target.value)}
              placeholder="예: 공동구매 특가 / 300개 한정 / 오늘마감"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>정렬순서</div>
            <input
              style={S.input}
              value={form.sort_order ?? ""}
              onChange={(e) => setField("sort_order", toNullableNumber(e.target.value))}
              placeholder="작을수록 위"
              inputMode="numeric"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대표 판매 문구</div>
            <input
              style={S.input}
              value={safe(form.headline_text, "")}
              onChange={(e) => setField("headline_text", e.target.value)}
              placeholder="예: 뿌리 활착 회복 관리 핵심 제품"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>긴급 문구</div>
            <input
              style={S.input}
              value={safe(form.urgency_text, "")}
              onChange={(e) => setField("urgency_text", e.target.value)}
              placeholder="예: 이번 주 공동구매 / 300개 한정"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>CTA 문구</div>
            <input
              style={S.input}
              value={safe(form.cta_text, "")}
              onChange={(e) => setField("cta_text", e.target.value)}
              placeholder="예: 지금 문의하면 행사 조건 안내"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>유튜브 링크</div>
            <input
              style={S.input}
              value={safe(form.youtube_url, "")}
              onChange={(e) => setField("youtube_url", e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>대표 이미지</div>
            <div style={S.uploadRow} className="vendor-product-upload-row">
              <input
                style={S.input}
                value={safe(form.image_url, "")}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="URL 직접 입력 가능"
              />
              <button
                type="button"
                style={S.uploadBtn}
                onClick={() => imageRef.current?.click()}
                disabled={uploadingField === "image_url"}
              >
                {uploadingField === "image_url" ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>추가 이미지</div>
            <div style={S.uploadRow} className="vendor-product-upload-row">
              <input
                style={S.input}
                value={safe(form.image_file_url, "")}
                onChange={(e) => setField("image_file_url", e.target.value)}
                placeholder="업로드 후 저장된 파일 URL"
              />
              <button
                type="button"
                style={S.uploadBtn}
                onClick={() => imageFileRef.current?.click()}
                disabled={uploadingField === "image_file_url"}
              >
                {uploadingField === "image_file_url" ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>썸네일 이미지</div>
            <div style={S.uploadRow} className="vendor-product-upload-row">
              <input
                style={S.input}
                value={safe(form.thumbnail_url, "")}
                onChange={(e) => setField("thumbnail_url", e.target.value)}
                placeholder="URL 직접 입력 가능"
              />
              <button
                type="button"
                style={S.uploadBtn}
                onClick={() => thumbRef.current?.click()}
                disabled={uploadingField === "thumbnail_url"}
              >
                {uploadingField === "thumbnail_url" ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>카탈로그 URL</div>
            <input
              style={S.input}
              value={safe(form.catalog_url, "")}
              onChange={(e) => setField("catalog_url", e.target.value)}
              placeholder="URL 직접 입력 가능"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>카탈로그 파일</div>
            <div style={S.uploadRow} className="vendor-product-upload-row">
              <input
                style={S.input}
                value={safe(form.catalog_file_url, "")}
                onChange={(e) => setField("catalog_file_url", e.target.value)}
                placeholder="파일 업로드 또는 URL 직접 입력"
              />
              <button
                type="button"
                style={S.uploadBtn}
                onClick={() => catalogRef.current?.click()}
                disabled={uploadingField === "catalog_file_url"}
              >
                {uploadingField === "catalog_file_url" ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>카탈로그 파일명</div>
            <input
              style={S.input}
              value={safe(form.catalog_filename, "")}
              onChange={(e) => setField("catalog_filename", e.target.value)}
              placeholder="자동 입력되며 필요 시 수정 가능"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>포인트 1</div>
            <input
              style={S.input}
              value={safe(form.point_1, "")}
              onChange={(e) => setField("point_1", e.target.value)}
              placeholder="예: 활착 촉진"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>포인트 2</div>
            <input
              style={S.input}
              value={safe(form.point_2, "")}
              onChange={(e) => setField("point_2", e.target.value)}
              placeholder="예: 생육 회복"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>포인트 3</div>
            <input
              style={S.input}
              value={safe(form.point_3, "")}
              onChange={(e) => setField("point_3", e.target.value)}
              placeholder="예: 균일 생육"
            />
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>제품 설명</div>
          <textarea
            style={S.textarea}
            value={safe(form.description, "")}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="제품 특징, 왜 좋은지, 언제 써야 하는지, 행사 이유를 쉽게 적으십시오."
          />
        </label>

        <div style={S.toggleRow}>
          <button
            type="button"
            style={form.is_active !== false ? S.toggleOn : S.toggleOff}
            onClick={() => setField("is_active", !(form.is_active !== false))}
          >
            활성 {form.is_active !== false ? "ON" : "OFF"}
          </button>
        </div>

        {notice ? <div style={S.notice}>{notice}</div> : null}
        {error ? <div style={S.error}>{error}</div> : null}

        <div style={S.actionRow}>
          <button
            type="submit"
            style={saving ? S.saveBtnDisabled : S.saveBtn}
            disabled={saving || !!uploadingField}
          >
            {saving ? "저장 중..." : isEditMode ? "제품 수정 저장" : "제품 추가 저장"}
          </button>

          <button type="button" style={S.resetBtn2} onClick={resetForm}>
            초기화
          </button>
        </div>
      </form>

      <div style={S.listTitle}>등록 제품 목록</div>

      {products.length === 0 ? (
        <div style={S.emptyBox}>등록된 제품이 없습니다.</div>
      ) : (
        <div style={S.listGrid}>
          {products.map((item, idx) => {
            const key = String(item.product_id ?? item.id ?? idx);
            const deleting = deletingKey === key;

            return (
              <div key={key} style={S.itemCard}>
                <div style={S.itemHead}>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.itemName}>
                      {safe(item.name ?? item.title, "제품명 없음")}
                    </div>

                    {originalPriceText(item) ? (
                      <div style={S.originalPrice}>{originalPriceText(item)}</div>
                    ) : null}

                    <div style={S.itemPrice}>{productPriceText(item)}</div>
                  </div>

                  <div style={S.itemMeta}>정렬 {String(item.sort_order ?? "-")}</div>
                </div>

                {productImage(item) ? (
                  <img
                    src={productImage(item)}
                    alt={safe(item.name ?? item.title, "제품")}
                    style={S.itemImage}
                  />
                ) : (
                  <div style={S.imageEmpty}>제품 이미지 없음</div>
                )}

                <div style={S.urgencyBadge}>
                  {safe(item.urgency_text, "행사 문구 없음")}
                </div>

                <div style={S.itemDesc}>
                  {safe(item.headline_text, safe(item.description, "설명 없음"))}
                </div>

                <div style={S.itemExtra}>
                  <div>유튜브: {safe(item.youtube_url, "없음")}</div>
                  <div>
                    카탈로그:{" "}
                    {safe(
                      item.catalog_filename,
                      safe(item.catalog_url || item.catalog_file_url, "없음")
                    )}
                  </div>
                </div>

                <div style={S.itemBtnRow}>
                  <button type="button" style={S.editBtn} onClick={() => startEdit(item)}>
                    수정
                  </button>

                  <button
                    type="button"
                    style={deleting ? S.deleteBtnDisabled : S.deleteBtn}
                    onClick={() => handleDelete(item)}
                    disabled={deleting}
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
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 24,
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#fff",
    padding: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
    maxWidth: 760,
  },
  metaWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  planBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontWeight: 900,
    fontSize: 12,
  },
  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
    fontWeight: 900,
    fontSize: 12,
  },
  limitBox: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  editorCard: {
    marginTop: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#fff",
    padding: 16,
  },
  editorTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  templateRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  templateChip: {
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.8,
  },
  uploadRow: {
    display: "grid",
    gridTemplateColumns: "1fr 96px",
    gap: 8,
  },
  uploadBtn: {
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  toggleRow: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },
  toggleOn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  toggleOff: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  notice: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 800,
    lineHeight: 1.7,
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
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  saveBtn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  saveBtnDisabled: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontWeight: 900,
    cursor: "not-allowed",
  },
  resetBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  resetBtn2: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  listTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  listGrid: {
    marginTop: 12,
    display: "grid",
    gap: 12,
  },
  itemCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  },
  itemHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 15,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.5,
  },
  originalPrice: {
    marginTop: 4,
    fontSize: 13,
    color: "#94a3b8",
    textDecoration: "line-through",
    fontWeight: 800,
  },
  itemPrice: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 950,
    color: "#dc2626",
  },
  itemMeta: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  itemImage: {
    marginTop: 10,
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    display: "block",
  },
  imageEmpty: {
    marginTop: 10,
    width: "100%",
    height: 150,
    borderRadius: 12,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 800,
  },
  urgencyBadge: {
    marginTop: 10,
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    fontSize: 12,
    fontWeight: 900,
  },
  itemDesc: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.8,
    color: "#334155",
  },
  itemExtra: {
    marginTop: 10,
    display: "grid",
    gap: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.7,
  },
  itemBtnRow: {
    marginTop: 12,
    display: "flex",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtnDisabled: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#fca5a5",
    color: "#fff",
    fontWeight: 900,
    cursor: "not-allowed",
  },
  emptyBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e5e7eb",
  },
};