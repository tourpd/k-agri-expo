/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = {
  id: string;
  brand_id: string;
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
  detail_description?: string | null;
  target_crops?: string | null;
  use_season?: string | null;
  how_to_use?: string | null;
  dosage_guide?: string | null;
  cautions?: string | null;
  image_url?: string | null;
  catalog_url?: string | null;
  price_krw?: number | null;
  unit_label?: string | null;
  youtube_urls?: string[] | null;
  is_active?: boolean | null;
};

export default function VendorProductEditPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    product_name: "",
    category: "",
    short_description: "",
    detail_description: "",
    target_crops: "",
    use_season: "",
    how_to_use: "",
    dosage_guide: "",
    cautions: "",
    image_url: "",
    catalog_url: "",
    price_krw: "",
    unit_label: "",
    youtube_urls: "",
    is_active: true,
  });

  async function load() {
    const res = await fetch(`/api/vendor/brand-products/detail?id=${id}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "제품을 불러오지 못했습니다.");
      location.href = "/vendor/products";
      return;
    }

    const item: Product = json.item;
    setProduct(item);

    setForm({
      product_name: item.product_name || "",
      category: item.category || "",
      short_description: item.short_description || "",
      detail_description: item.detail_description || "",
      target_crops: item.target_crops || "",
      use_season: item.use_season || "",
      how_to_use: item.how_to_use || "",
      dosage_guide: item.dosage_guide || "",
      cautions: item.cautions || "",
      image_url: item.image_url || "",
      catalog_url: item.catalog_url || "",
      price_krw: item.price_krw ? String(item.price_krw) : "",
      unit_label: item.unit_label || "",
      youtube_urls: Array.isArray(item.youtube_urls)
        ? item.youtube_urls.join("\n")
        : "",
      is_active: item.is_active !== false,
    });

    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function uploadFile(file: File, assetType: "product" | "catalog") {
    const data = new FormData();
    data.append("file", file);
    data.append("asset_type", assetType);
    data.append("brand_slug", "dof-eagle-five");

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

  async function runAiExtract() {
    if (!id) return;

    try {
      setSaving(true);

      const res = await fetch("/api/vendor/brand-products/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "AI 분석 실패");
        return;
      }

      await load();
      alert("AI 분석 완료");
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!product?.brand_id) {
      alert("brand_id 확인 실패");
      return;
    }

    if (!form.product_name.trim()) {
      alert("제품명을 입력하세요.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/vendor/brand-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          brand_id: product.brand_id,
          product_name: form.product_name,
          category: form.category,
          short_description: form.short_description,
          detail_description: form.detail_description,
          target_crops: form.target_crops,
          use_season: form.use_season,
          how_to_use: form.how_to_use,
          dosage_guide: form.dosage_guide,
          cautions: form.cautions,
          image_url: form.image_url,
          catalog_url: form.catalog_url,
          price_krw: Number(form.price_krw.replace(/[^0-9]/g, "")) || null,
          unit_label: form.unit_label,
          youtube_urls: form.youtube_urls
            .split(/\n|,/)
            .map((v) => v.trim())
            .filter(Boolean),
          is_active: form.is_active,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "수정 실패");
        return;
      }

      alert("제품 수정 완료");
      location.href = "/vendor/products";
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-2xl font-black">
          제품 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/vendor/products"
          className="inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-stone-800 ring-1 ring-black/10"
        >
          ← 내 제품 관리로 돌아가기
        </Link>

        <div className="mt-4 rounded-[32px] bg-green-800 p-6 text-white">
          <p className="text-sm font-black text-lime-200">
            K-Agri Expo 업체 운영센터
          </p>
          <h1 className="mt-2 text-3xl font-black">제품 수정</h1>
        </div>

        <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-5">
            <FileBox
              title="제품 이미지"
              url={form.image_url}
              accept="image/*"
              onChange={async (file) => {
                if (!file) return;
                const url = await uploadFile(file, "product");
                if (url) setForm((p) => ({ ...p, image_url: url }));
              }}
            />

            <Field label="제품명">
              <input
                value={form.product_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, product_name: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="카테고리">
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className={inputClass}
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

            <FileBox
              title="카탈로그"
              url={form.catalog_url}
              accept="application/pdf,image/*"
              onChange={async (file) => {
                if (!file) return;
                const url = await uploadFile(file, "catalog");
                if (url) setForm((p) => ({ ...p, catalog_url: url }));
              }}
            />

            <button
              type="button"
              onClick={runAiExtract}
              disabled={saving}
              className="rounded-2xl bg-yellow-300 px-5 py-5 text-xl font-black text-stone-950 disabled:opacity-50"
            >
              {saving ? "AI 분석중..." : "카탈로그 AI 재분석"}
            </button>

            <Field label="제품 특징">
              <textarea
                rows={6}
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
                rows={5}
                value={form.how_to_use}
                onChange={(e) =>
                  setForm((p) => ({ ...p, how_to_use: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="사용량">
              <textarea
                rows={5}
                value={form.dosage_guide}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dosage_guide: e.target.value }))
                }
                className={textareaClass}
              />
            </Field>

            <Field label="주의사항">
              <textarea
                rows={5}
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
                />
              </Field>

              <Field label="판매 단위">
                <input
                  value={form.unit_label}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unit_label: e.target.value }))
                  }
                  className={inputClass}
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
              />
            </Field>

            <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-5 text-lg font-black">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_active: e.target.checked }))
                }
                className="h-6 w-6"
              />
              농민 화면에 노출
            </label>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-2xl bg-green-700 px-5 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {saving ? "저장중..." : "수정 저장"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none focus:border-green-700";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
  url,
  accept,
  onChange,
}: {
  title: string;
  url: string;
  accept: string;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-200">
      <p className="text-xl font-black text-stone-900">{title}</p>

      {url ? (
        url.toLowerCase().includes(".pdf") ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-2xl bg-white p-4 text-center text-lg font-black text-green-800"
          >
            업로드한 PDF 보기
          </a>
        ) : (
          <img
            src={url}
            alt={title}
            className="mt-4 max-h-72 w-full rounded-2xl bg-white object-contain p-4"
          />
        )
      ) : null}

      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0])}
        className="mt-4 w-full rounded-2xl bg-white p-4 text-base font-bold text-stone-950"
      />
    </div>
  );
}