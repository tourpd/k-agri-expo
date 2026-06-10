/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEFAULT_BRAND_SLUG = "dof-eagle-five";
const TEMP_PRODUCT_NAME = "AI 분석 대기 제품";

type Brand = {
  id?: string;
  brand_slug?: string | null;
  brand_name?: string | null;
};

type ProductForm = {
  product_name: string;
  category: string;
  short_description: string;
  detail_description: string;
  target_crops: string;
  use_season: string;
  how_to_use: string;
  dosage_guide: string;
  cautions: string;
  price_krw: string;
  unit_label: string;
  youtube_urls: string;
};

const emptyForm: ProductForm = {
  product_name: "",
  category: "",
  short_description: "",
  detail_description: "",
  target_crops: "",
  use_season: "",
  how_to_use: "",
  dosage_guide: "",
  cautions: "",
  price_krw: "",
  unit_label: "",
  youtube_urls: "",
};

export default function VendorProductNewClient() {
  const [brand, setBrand] = useState<Brand>({});
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedProductId, setSavedProductId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [catalogUrl, setCatalogUrl] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const brandSlug = brand.brand_slug || DEFAULT_BRAND_SLUG;

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/vendor/brand-hall?brand_slug=${DEFAULT_BRAND_SLUG}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setBrand(json.brand || {});
    }

    load();
  }, []);

  async function uploadFile(file: File, assetType: "product" | "catalog") {
    const data = new FormData();
    data.append("file", file);
    data.append("asset_type", assetType);
    data.append("brand_slug", brandSlug);

    const res = await fetch("/api/vendor/brand-assets/upload", {
      method: "POST",
      body: data,
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "파일 업로드 실패");
      return "";
    }

    return String(json.public_url || "");
  }

  async function saveProductBase(options?: { allowTempName?: boolean }) {
    if (!brand.id) {
      alert("브랜드 정보를 먼저 불러와야 합니다.");
      return "";
    }

    const productName = form.product_name.trim();

    if (!productName && !options?.allowTempName) {
      alert("제품명을 입력하세요.");
      return "";
    }

    const res = await fetch("/api/vendor/brand-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: savedProductId || undefined,
        brand_id: brand.id,
        product_name: productName || TEMP_PRODUCT_NAME,
        category: form.category,
        short_description: form.short_description,
        detail_description: form.detail_description,
        target_crops: form.target_crops,
        use_season: form.use_season,
        how_to_use: form.how_to_use,
        dosage_guide: form.dosage_guide,
        cautions: form.cautions,
        image_url: imageUrl,
        catalog_url: catalogUrl,
        price_krw: Number(form.price_krw.replace(/[^0-9]/g, "")) || null,
        unit_label: form.unit_label,
        youtube_urls: form.youtube_urls
          .split(/\n|,/)
          .map((v) => v.trim())
          .filter(Boolean),
        is_active: true,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "제품 저장 실패");
      return "";
    }

    const id = String(json.item?.id || "");
    if (id) setSavedProductId(id);

    return id;
  }

  async function analyzeCatalog() {
    if (!catalogUrl) {
      alert("카탈로그를 먼저 업로드하세요.");
      return;
    }

    try {
      setAnalyzing(true);

      const productId = await saveProductBase({ allowTempName: true });
      if (!productId) return;

      const res = await fetch("/api/vendor/brand-products/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "AI 분석 실패");
        return;
      }

      const item = json.item || {};

      setForm((prev) => ({
        ...prev,
        product_name:
          item.product_name && item.product_name !== TEMP_PRODUCT_NAME
            ? item.product_name
            : prev.product_name,
        category: item.category || prev.category,
        short_description: item.short_description || prev.short_description,
        detail_description: item.detail_description || prev.detail_description,
        target_crops: item.target_crops || prev.target_crops,
        use_season: item.use_season || prev.use_season,
        how_to_use: item.how_to_use || prev.how_to_use,
        dosage_guide: item.dosage_guide || prev.dosage_guide,
        cautions: item.cautions || prev.cautions,
      }));

      alert("카탈로그 AI 자동입력 완료");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveProduct() {
    try {
      setSaving(true);

      const productId = await saveProductBase();
      if (!productId) return;

      alert("제품 등록 완료");
      location.href = "/vendor/products";
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/vendor/products"
          className="inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-stone-900 ring-1 ring-black/10"
        >
          ← 내 제품 관리로 돌아가기
        </Link>

        <div className="mt-4 rounded-[32px] bg-green-800 p-6 text-white">
          <p className="text-sm font-black text-lime-200">
            {brand.brand_name || "K-Agri Expo"}
          </p>
          <h1 className="mt-2 text-3xl font-black">제품 새로 등록</h1>
          <p className="mt-3 text-lg font-bold text-green-50">
            카탈로그만 먼저 올려도 AI가 제품명과 기본 정보를 자동으로 채웁니다.
          </p>
        </div>

        <section className="mt-5 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-5">
            <FileBox
              title="제품 이미지"
              desc="제품 사진 또는 대표 이미지를 올리세요."
              imageUrl={imageUrl}
              onChange={async (file) => {
                if (!file) return;
                const url = await uploadFile(file, "product");
                if (url) setImageUrl(url);
              }}
            />

            <FileBox
              title="카탈로그"
              desc="PDF 또는 이미지를 올린 뒤 AI 자동입력을 누르세요."
              imageUrl={catalogUrl}
              accept="application/pdf,image/*"
              onChange={async (file) => {
                if (!file) return;
                const url = await uploadFile(file, "catalog");
                if (url) setCatalogUrl(url);
              }}
            />

            <button
              type="button"
              onClick={analyzeCatalog}
              disabled={analyzing || !catalogUrl}
              className="rounded-2xl bg-yellow-300 px-5 py-5 text-xl font-black text-stone-950 disabled:bg-stone-200 disabled:text-stone-500"
            >
              {analyzing ? "AI 분석중..." : "AI로 카탈로그 자동입력"}
            </button>

            <Field label="제품명">
              <input
                value={form.product_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, product_name: e.target.value }))
                }
                className={inputClass}
                placeholder="AI가 못 찾으면 직접 입력하세요"
              />
            </Field>

            <Field label="카테고리">
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className={inputClass}
                placeholder="예: 완효성 비료 / 영양제 / 유기농자재"
              />
            </Field>

            <Field label="한 줄 설명">
              <textarea
                rows={3}
                value={form.short_description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, short_description: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="제품 특징">
              <textarea
                rows={5}
                value={form.detail_description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, detail_description: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="추천 작물">
              <input
                value={form.target_crops}
                onChange={(e) =>
                  setForm((p) => ({ ...p, target_crops: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="사용 시기">
              <input
                value={form.use_season}
                onChange={(e) =>
                  setForm((p) => ({ ...p, use_season: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="사용 방법">
              <textarea
                rows={4}
                value={form.how_to_use}
                onChange={(e) =>
                  setForm((p) => ({ ...p, how_to_use: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="사용량">
              <textarea
                rows={4}
                value={form.dosage_guide}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dosage_guide: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="주의사항">
              <textarea
                rows={4}
                value={form.cautions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cautions: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="가격">
                <input
                  value={form.price_krw}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price_krw: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="예: 25000"
                />
              </Field>

              <Field label="판매 단위">
                <input
                  value={form.unit_label}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unit_label: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="예: 2kg / 500ml / 1포"
                />
              </Field>
            </div>

            <Field label="유튜브 링크">
              <textarea
                rows={3}
                value={form.youtube_urls}
                onChange={(e) =>
                  setForm((p) => ({ ...p, youtube_urls: e.target.value }))
                }
                className={textareaClass}
                placeholder="영상 링크가 여러 개면 줄바꿈으로 입력"
              />
            </Field>

            <button
              type="button"
              onClick={saveProduct}
              disabled={saving}
              className="rounded-2xl bg-green-700 px-5 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {saving ? "저장중..." : "제품 등록하기"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-green-700";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-black text-stone-900">
        {label}
      </span>
      {children}
    </label>
  );
}

function FileBox({
  title,
  desc,
  imageUrl,
  accept = "image/*",
  onChange,
}: {
  title: string;
  desc: string;
  imageUrl: string;
  accept?: string;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-200">
      <p className="text-xl font-black text-stone-900">{title}</p>
      <p className="mt-1 text-base font-bold text-stone-700">{desc}</p>

      {imageUrl ? (
        imageUrl.toLowerCase().includes(".pdf") ? (
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-2xl bg-white p-4 text-center text-lg font-black text-green-800 ring-1 ring-black/10"
          >
            업로드한 PDF 보기
          </a>
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className="mt-4 max-h-64 w-full rounded-2xl bg-white object-contain p-3"
          />
        )
      ) : null}

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl bg-white px-5 py-5 text-lg font-black text-stone-950 ring-1 ring-black/10">
        파일 선택하기
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}