"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductEditorSection from "@/components/vendor/brand-hall/ProductEditorSection";
import UploadBox from "@/components/vendor/brand-hall/UploadBox";
import PreviewFile from "@/components/vendor/brand-hall/PreviewFile";

type Brand = {
  id?: string;
  hall_key?: string;
  brand_slug?: string | null;
  brand_name: string;
  logo_url?: string | null;
  banner_url?: string | null;
  banner_height?: number | null;
  short_description?: string | null;
  main_category?: string | null;
  youtube_url?: string | null;
  homepage_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  blog_url?: string | null;
  sns_url?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_holder?: string | null;
  is_active?: boolean | null;
};

type Product = {
  id: string;
  product_name: string;
  category?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  catalog_url?: string | null;
  manual_url?: string | null;
  is_active?: boolean | null;
};

type EventItem = {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  catalog_url?: string | null;
  manual_url?: string | null;
  is_active?: boolean | null;
};

type ProductForm = {
  product_name: string;
  category: string;
  short_description: string;
  image_url: string;
  youtube_urls: string;
  detail_description: string;
  target_crops: string;
  use_season: string;
  how_to_use: string;
  dosage_guide: string;
  cautions: string;
  catalog_url: string;
  manual_url: string;
  price_krw: string;
  shipping_fee_krw: string;
  unit_label: string;
  base_area_pyeong: string;
  recommended_rounds: string;
  spray_interval: string;
  use_period: string;
};

type EventForm = {
  event_type: string;
  title: string;
  description: string;
  image_url: string;
  youtube_urls: string;
  detail_description: string;
  event_condition: string;
  event_period: string;
  target_product: string;
  catalog_url: string;
  manual_url: string;
  price_krw: string;
  shipping_fee_krw: string;
};

const DEFAULT_BRAND_SLUG = "dof-eagle-five";

const emptyProductForm: ProductForm = {
  product_name: "",
  category: "",
  short_description: "",
  image_url: "",
  youtube_urls: "",
  detail_description: "",
  target_crops: "",
  use_season: "",
  how_to_use: "",
  dosage_guide: "",
  cautions: "",
  catalog_url: "",
  manual_url: "",
  price_krw: "",
  shipping_fee_krw: "",
  unit_label: "",
  base_area_pyeong: "",
  recommended_rounds: "",
  spray_interval: "",
  use_period: "",
};

const emptyEventForm: EventForm = {
  event_type: "공동구매",
  title: "",
  description: "",
  image_url: "",
  youtube_urls: "",
  detail_description: "",
  event_condition: "",
  event_period: "",
  target_product: "",
  catalog_url: "",
  manual_url: "",
  price_krw: "",
  shipping_fee_krw: "",
};

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none placeholder:text-stone-400 focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none placeholder:text-stone-400 focus:border-green-700";

function parseUrls(value: string) {
  return value.split(/\n|,/).map((v) => v.trim()).filter(Boolean);
}

function toNumberOrNull(value: string) {
  const n = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hasProductInput(form: ProductForm) {
  return Boolean(
    form.product_name.trim() ||
      form.image_url ||
      form.catalog_url ||
      form.manual_url ||
      form.short_description.trim() ||
      form.detail_description.trim()
  );
}

function hasEventInput(form: EventForm) {
  return Boolean(
    form.title.trim() ||
      form.image_url ||
      form.catalog_url ||
      form.manual_url ||
      form.description.trim() ||
      form.detail_description.trim()
  );
}

export default function BrandHallEditorClient() {
  const [brand, setBrand] = useState<Brand>({
    brand_slug: DEFAULT_BRAND_SLUG,
    brand_name: "",
    short_description: "",
    main_category: "",
    youtube_url: "",
    homepage_url: "",
    instagram_url: "",
    facebook_url: "",
    blog_url: "",
    sns_url: "",
    bank_name: "기업은행",
    bank_account: "486-072683-04-011",
    bank_holder: "한국농수산TV",
    banner_height: 260,
    is_active: true,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products]
  );

  const activeEvents = useMemo(
    () => events.filter((e) => e.is_active).length,
    [events]
  );

  async function loadData() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/vendor/brand-hall?brand_slug=${brand.brand_slug || DEFAULT_BRAND_SLUG}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (json.brand) {
        setBrand({
          ...json.brand,
          banner_height: json.brand.banner_height || 260,
          bank_name: json.brand.bank_name || "기업은행",
          bank_account: json.brand.bank_account || "486-072683-04-011",
          bank_holder: json.brand.bank_holder || "한국농수산TV",
        });
      }

      setProducts(json.products ?? []);
      setEvents(json.events ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadAsset(
    file: File,
    assetType: "logo" | "banner" | "product" | "event" | "catalog" | "manual"
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("asset_type", assetType);
    formData.append("brand_slug", brand.brand_slug || DEFAULT_BRAND_SLUG);

    setSaving(true);

    try {
      const res = await fetch("/api/vendor/brand-assets/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "파일 업로드 실패");
        return "";
      }

      return json.public_url as string;
    } finally {
      setSaving(false);
    }
  }

  async function handleBrandImageUpload(
    file: File | undefined,
    assetType: "logo" | "banner"
  ) {
    if (!file) return;

    const publicUrl = await uploadAsset(file, assetType);
    if (!publicUrl) return;

    setBrand((prev) => ({
      ...prev,
      [assetType === "logo" ? "logo_url" : "banner_url"]: publicUrl,
    }));
  }

  async function handleProductFileUpload(
    file: File | undefined,
    assetType: "product" | "catalog" | "manual"
  ) {
    if (!file) return;

    const publicUrl = await uploadAsset(file, assetType);
    if (!publicUrl) return;

    setProductForm((prev) => ({
      ...prev,
      ...(assetType === "product" ? { image_url: publicUrl } : {}),
      ...(assetType === "catalog" ? { catalog_url: publicUrl } : {}),
      ...(assetType === "manual" ? { manual_url: publicUrl } : {}),
    }));
  }

  async function handleEventFileUpload(
    file: File | undefined,
    assetType: "event" | "catalog" | "manual"
  ) {
    if (!file) return;

    const publicUrl = await uploadAsset(file, assetType);
    if (!publicUrl) return;

    setEventForm((prev) => ({
      ...prev,
      ...(assetType === "event" ? { image_url: publicUrl } : {}),
      ...(assetType === "catalog" ? { catalog_url: publicUrl } : {}),
      ...(assetType === "manual" ? { manual_url: publicUrl } : {}),
    }));
  }

  async function saveBrandOnly() {
    const res = await fetch("/api/vendor/brand-hall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brand),
    });

    const json = await res.json();

    if (!json.ok) {
      throw new Error(json.error || "브랜드 저장 실패");
    }

    return json.item || json.brand || null;
  }

  async function saveProductWithBrandId(brandId: string) {
    if (!hasProductInput(productForm)) return null;

    if (!productForm.product_name.trim()) {
      throw new Error("제품명을 입력하세요.");
    }

    const res = await fetch("/api/vendor/brand-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_id: brandId,
        product_name: productForm.product_name,
        category: productForm.category,
        short_description: productForm.short_description,
        image_url: productForm.image_url,
        youtube_urls: parseUrls(productForm.youtube_urls),
        detail_description: productForm.detail_description,
        target_crops: productForm.target_crops,
        use_season: productForm.use_season,
        how_to_use: productForm.how_to_use,
        dosage_guide: productForm.dosage_guide,
        cautions: productForm.cautions,
        catalog_url: productForm.catalog_url,
        manual_url: productForm.manual_url,
        price_krw: toNumberOrNull(productForm.price_krw),
        shipping_fee_krw: toNumberOrNull(productForm.shipping_fee_krw),
        unit_label: productForm.unit_label,
        base_area_pyeong: toNumberOrNull(productForm.base_area_pyeong),
        recommended_rounds: toNumberOrNull(productForm.recommended_rounds),
        spray_interval: productForm.spray_interval,
        use_period: productForm.use_period,
        is_active: true,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      throw new Error(json.error || "제품 저장 실패");
    }

    return json.item || null;
  }

  async function saveEventWithBrandId(brandId: string) {
    if (!hasEventInput(eventForm)) return null;

    if (!eventForm.title.trim()) {
      throw new Error("이벤트 제목을 입력하세요.");
    }

    const res = await fetch("/api/vendor/brand-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_id: brandId,
        event_type: eventForm.event_type,
        title: eventForm.title,
        description: eventForm.description,
        image_url: eventForm.image_url,
        youtube_urls: parseUrls(eventForm.youtube_urls),
        detail_description: eventForm.detail_description,
        event_condition: eventForm.event_condition,
        event_period: eventForm.event_period,
        target_product: eventForm.target_product,
        catalog_url: eventForm.catalog_url,
        manual_url: eventForm.manual_url,
        price_krw: toNumberOrNull(eventForm.price_krw),
        shipping_fee_krw: toNumberOrNull(eventForm.shipping_fee_krw),
        is_active: true,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      throw new Error(json.error || "이벤트 저장 실패");
    }

    return json.item || null;
  }

  async function saveAll() {
    try {
      setSaving(true);

      const savedBrand = await saveBrandOnly();
      const brandId = savedBrand?.id || brand.id;

      if (!brandId) {
        throw new Error("브랜드 ID 확인 실패");
      }

      const savedProduct = await saveProductWithBrandId(brandId);
      const savedEvent = await saveEventWithBrandId(brandId);

      if (savedProduct?.id) {
        setSelectedProductId(savedProduct.id);
        setProductForm(emptyProductForm);
      }

      if (savedEvent?.id) {
        setEventForm(emptyEventForm);
      }

      await loadData();

      alert("통합 저장 완료");
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function extractProductByAI(productId?: string) {
    const targetProductId = productId || selectedProductId;

    if (!targetProductId) {
      alert("먼저 제품 저장 후 AI 분석을 눌러주세요.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/vendor/brand-products/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: targetProductId }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "AI 분석 실패");
        return;
      }

      const item = json.item;

      setProductForm((prev) => ({
        ...prev,
        product_name: item.product_name || prev.product_name,
        category: item.category || prev.category,
        short_description: item.short_description || prev.short_description,
        detail_description: item.detail_description || "",
        target_crops: item.target_crops || "",
        use_season: item.use_season || "",
        how_to_use: item.how_to_use || "",
        dosage_guide: item.dosage_guide || "",
        cautions: item.cautions || "",
        base_area_pyeong: item.base_area_pyeong ? String(item.base_area_pyeong) : "",
        recommended_rounds: item.recommended_rounds ? String(item.recommended_rounds) : "",
        spray_interval: item.spray_interval || "",
        use_period: item.use_period || "",
      }));

      await loadData();
      alert("AI 제품정보 분석 완료");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("숨김 처리할까요?")) return;

    const res = await fetch("/api/vendor/brand-products/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "삭제 실패");
      return;
    }

    await loadData();
  }

  async function deleteEvent(id: string) {
    if (!confirm("숨김 처리할까요?")) return;

    const res = await fetch("/api/vendor/brand-events/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "삭제 실패");
      return;
    }

    await loadData();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] p-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-2xl font-extrabold">
          브랜드관 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] pb-40">
      <section className="mx-auto max-w-6xl px-4 py-5">
        <div className="rounded-[32px] bg-gradient-to-br from-green-800 to-lime-700 p-6 text-white">
          <p className="text-sm font-extrabold text-lime-200">
            K-Agri Expo 업체 운영센터
          </p>

          <h1 className="mt-2 text-3xl font-extrabold">브랜드관 관리</h1>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link
              href={`/expo/brands/${brand.brand_slug || DEFAULT_BRAND_SLUG}`}
              className="rounded-2xl bg-white px-5 py-4 text-center text-lg font-extrabold text-green-900"
            >
              내 브랜드관 보기
            </Link>

            <Link
              href="/expo/brands"
              className="rounded-2xl bg-yellow-300 px-5 py-4 text-center text-lg font-extrabold text-stone-900"
            >
              브랜드 전체보기
            </Link>

            <button
              type="button"
              onClick={loadData}
              className="rounded-2xl bg-green-950 px-5 py-4 text-lg font-extrabold text-white"
            >
              새로고침
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard title="브랜드 상태" value={brand.is_active ? "운영중" : "숨김"} />
          <StatCard title="노출 제품" value={`${activeProducts}개`} />
          <StatCard title="진행 이벤트" value={`${activeEvents}개`} />
          <StatCard title="저장 상태" value={saving ? "저장중" : "정상"} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-3xl font-extrabold text-stone-900">
              브랜드 기본 정보
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <UploadBox
                label="브랜드 로고 업로드"
                desc="정사각형 로고로 자동 정리됩니다."
                buttonText={brand.logo_url ? "로고 다시 업로드" : "로고 선택"}
                accept="image/*"
                previewUrl={brand.logo_url || ""}
                onChange={(file) => handleBrandImageUpload(file, "logo")}
              />

              <UploadBox
                label="브랜드 배너 업로드"
                desc="브랜드 상단 간판 이미지입니다."
                buttonText={brand.banner_url ? "배너 다시 업로드" : "배너 선택"}
                accept="image/*"
                previewUrl={brand.banner_url || ""}
                onChange={(file) => handleBrandImageUpload(file, "banner")}
              />
            </div>

            <div className="mt-6 grid gap-5">
              <Field label="브랜드명">
                <input
                  value={brand.brand_name || ""}
                  onChange={(e) =>
                    setBrand((prev) => ({ ...prev, brand_name: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="브랜드관 주소">
                <input
                  value={brand.brand_slug || ""}
                  onChange={(e) =>
                    setBrand((prev) => ({ ...prev, brand_slug: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="한 줄 소개">
                <textarea
                  rows={4}
                  value={brand.short_description || ""}
                  onChange={(e) =>
                    setBrand((prev) => ({
                      ...prev,
                      short_description: e.target.value,
                    }))
                  }
                  className={textareaClass}
                />
              </Field>

              <Field label="대표 카테고리">
                <input
                  value={brand.main_category || ""}
                  onChange={(e) =>
                    setBrand((prev) => ({ ...prev, main_category: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <BrandPreview brand={brand} products={products} events={events} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h2 className="mb-4 text-3xl font-extrabold text-stone-900">
              대표 제품 상세페이지 등록
            </h2>

            <ProductEditorSection
              productForm={productForm}
              setProductForm={setProductForm}
              saving={saving}
              handleProductFileUpload={handleProductFileUpload}
              extractProductByAI={() => extractProductByAI()}
            />

            <ItemList
              type="product"
              items={products}
              onDelete={deleteProduct}
              onExtractAI={extractProductByAI}
            />
          </div>

          <ProductPreview product={productForm} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-3xl font-extrabold text-stone-900">
              공동구매 · 샘플 · 이벤트 등록
            </h2>

            <div className="mt-6 grid gap-4">
              <UploadBox
                label="이벤트 이미지 업로드"
                desc="이벤트 대표 이미지입니다."
                buttonText={eventForm.image_url ? "이미지 다시 업로드" : "이미지 선택"}
                accept="image/*"
                previewUrl={eventForm.image_url}
                onChange={(file) => handleEventFileUpload(file, "event")}
              />

              {eventForm.image_url ? (
                <PreviewFile
                  url={eventForm.image_url}
                  label="이벤트 이미지 미리보기"
                  onDelete={() =>
                    setEventForm((prev) => ({ ...prev, image_url: "" }))
                  }
                />
              ) : null}

              <Field label="이벤트 종류">
                <select
                  value={eventForm.event_type}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      event_type: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="공동구매">공동구매</option>
                  <option value="샘플">샘플</option>
                  <option value="라이브">라이브</option>
                  <option value="특가">특가</option>
                </select>
              </Field>

              <Field label="이벤트 제목">
                <input
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="짧은 설명">
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={textareaClass}
                />
              </Field>
            </div>

            <ItemList type="event" items={events} onDelete={deleteEvent} />
          </div>

          <EventPreview event={eventForm} />
        </section>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-3 px-4 py-4">
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="flex-1 rounded-2xl bg-green-700 px-5 py-5 text-xl font-extrabold text-white disabled:opacity-60"
          >
            {saving ? "통합 저장중..." : "통합 저장"}
          </button>

          <button
            type="button"
            onClick={() =>
              setBrand((prev) => ({ ...prev, is_active: !prev.is_active }))
            }
            className="rounded-2xl bg-stone-900 px-5 py-5 text-xl font-extrabold text-white"
          >
            {brand.is_active ? "숨김" : "운영"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-lg font-extrabold text-stone-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-base font-extrabold text-stone-600">{title}</p>
      <p className="mt-3 text-3xl font-extrabold text-stone-950">{value}</p>
    </div>
  );
}

function ItemList({
  type,
  items,
  onDelete,
  onExtractAI,
}: {
  type: "product" | "event";
  items: Array<Product | EventItem>;
  onDelete: (id: string) => void;
  onExtractAI?: (id: string) => void;
}) {
  return (
    <div className="mt-6 grid gap-4">
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center text-xl font-extrabold text-stone-600">
          아직 등록된 항목이 없습니다.
        </div>
      ) : (
        items.map((item: any) => (
          <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={type === "product" ? item.product_name : item.title}
                className="mb-4 h-44 w-full rounded-2xl bg-stone-50 object-contain"
              />
            ) : null}

            <h3 className="text-2xl font-extrabold text-stone-900">
              {type === "product" ? item.product_name : item.title}
            </h3>

            <p className="mt-2 text-lg font-bold text-stone-600">
              {type === "product" ? item.short_description : item.description}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link
                href={
                  type === "product"
                    ? `/expo/brand-products/${item.id}`
                    : `/expo/brand-events/${item.id}`
                }
                className="rounded-2xl bg-green-700 px-4 py-4 text-center text-lg font-extrabold text-white"
              >
                상세보기
              </Link>

              {type === "product" && onExtractAI ? (
                <button
                  type="button"
                  onClick={() => onExtractAI(item.id)}
                  className="rounded-2xl bg-yellow-300 px-4 py-4 text-lg font-extrabold text-stone-900"
                >
                  AI 분석
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-2xl bg-red-600 px-4 py-4 text-lg font-extrabold text-white"
              >
                숨김
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BrandPreview({
  brand,
  products,
  events,
}: {
  brand: Brand;
  products: Product[];
  events: EventItem[];
}) {
  return (
    <aside className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-base font-extrabold text-green-700">
        농민 화면 미리보기
      </p>

      <div className="mt-4 overflow-hidden rounded-3xl bg-stone-50 ring-1 ring-black/5">
        {brand.banner_url ? (
          <img
            src={brand.banner_url}
            alt="배너 미리보기"
            className="h-48 w-full bg-white object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-green-800 text-xl font-extrabold text-white">
            브랜드 배너
          </div>
        )}

        <div className="p-5">
          <h3 className="text-2xl font-extrabold text-stone-900">
            {brand.brand_name || "브랜드명"}
          </h3>

          <p className="mt-2 text-lg font-bold text-stone-600">
            {brand.short_description || "브랜드 한 줄 소개"}
          </p>

          <p className="mt-4 text-base font-extrabold text-green-700">
            제품 {products.length}개 · 이벤트 {events.length}개
          </p>
        </div>
      </div>
    </aside>
  );
}

function ProductPreview({ product }: { product: ProductForm }) {
  return (
    <aside className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-base font-extrabold text-green-700">
        제품 미리보기
      </p>

      <div className="mt-4 rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt="제품"
            className="h-56 w-full rounded-2xl bg-white object-contain"
          />
        ) : null}

        <h3 className="mt-4 text-2xl font-extrabold text-stone-900">
          {product.product_name || "제품명"}
        </h3>

        <p className="mt-2 text-lg font-bold text-stone-600">
          {product.short_description || "제품 한 줄 설명"}
        </p>
      </div>
    </aside>
  );
}

function EventPreview({ event }: { event: EventForm }) {
  return (
    <aside className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-base font-extrabold text-yellow-700">
        이벤트 미리보기
      </p>

      <div className="mt-4 rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt="이벤트"
            className="h-48 w-full rounded-2xl bg-white object-contain"
          />
        ) : null}

        <h3 className="mt-4 text-2xl font-extrabold text-stone-900">
          {event.title || "이벤트 제목"}
        </h3>

        <p className="mt-2 text-lg font-bold text-stone-600">
          {event.description || "이벤트 설명"}
        </p>
      </div>
    </aside>
  );
}