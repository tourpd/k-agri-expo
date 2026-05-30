"use client";

import React, { useState } from "react";
import BoothBasicForm from "@/components/expo/editor/BoothBasicForm";
import ProductForm from "@/components/expo/editor/ProductForm";
import ProductList from "@/components/expo/editor/ProductList";
import { createEmptyProductSpec } from "@/types/expo-product-spec";

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

  youtube_url?: string;

  logo_url?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  banner_url?: string;

  is_public?: boolean;
  is_active?: boolean;
  is_published?: boolean;
  status?: string;
};

type ProductSpecShape = ReturnType<typeof createEmptyProductSpec>;

type ProductShape = {
  id?: string | number;
  product_id?: string | number;
  booth_id?: string;

  name?: string;
  title?: string;
  description?: string;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string;

  purchase_url?: string;

  image_url?: string;
  image_file_url?: string;
  thumbnail_url?: string;

  catalog_url?: string;
  catalog_file_url?: string;
  catalog_filename?: string;

  youtube_url?: string;

  headline_text?: string;
  urgency_text?: string;
  cta_text?: string;

  point_1?: string;
  point_2?: string;
  point_3?: string;

  dealer_apply_url?: string;
  buyer_apply_url?: string;

  usage_summary?: string;
  usage_method?: string;
  usage_timing?: string;
  usage_interval?: string;
  usage_crops?: string;
  caution_text?: string;

  calc_base_water_liter?: number | null;
  calc_base_product_ml?: number | null;
  calc_base_area_pyeong?: number | null;

  is_active?: boolean;
  status?: string;
  sort_order?: number | null;

  spec?: ProductSpecShape;
};

type BoothEditorClientProps = {
  vendor: VendorShape;
  booth: BoothShape;
  initialProducts: ProductShape[];
};

function normalizeProduct(item: ProductShape): ProductShape {
  return {
    ...item,
    booth_id: item.booth_id || "",
    name: item.name || "",
    title: item.title || "",
    description: item.description || "",
    price_text: item.price_text || "",
    purchase_url: item.purchase_url || "",
    image_url: item.image_url || "",
    image_file_url: item.image_file_url || "",
    thumbnail_url: item.thumbnail_url || "",
    catalog_url: item.catalog_url || "",
    catalog_file_url: item.catalog_file_url || "",
    catalog_filename: item.catalog_filename || "",
    youtube_url: item.youtube_url || "",
    headline_text: item.headline_text || "",
    urgency_text: item.urgency_text || "",
    cta_text: item.cta_text || "지금 구매하기",
    point_1: item.point_1 || "",
    point_2: item.point_2 || "",
    point_3: item.point_3 || "",
    dealer_apply_url: item.dealer_apply_url || "",
    buyer_apply_url: item.buyer_apply_url || "",
    usage_summary: item.usage_summary || "",
    usage_method: item.usage_method || "",
    usage_timing: item.usage_timing || "",
    usage_interval: item.usage_interval || "",
    usage_crops: item.usage_crops || "",
    caution_text: item.caution_text || "",
    is_active: item.is_active !== false,
    status: item.status || "active",
    spec: {
      ...createEmptyProductSpec(),
      ...(item.spec ?? {}),
    },
  };
}

function normalizeProducts(rows: ProductShape[]): ProductShape[] {
  return [...(rows || [])]
    .map((row) => normalizeProduct(row))
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

function createEmptyProduct(boothId?: string): ProductShape {
  return {
    booth_id: boothId || "",
    name: "",
    title: "",
    description: "",
    price_krw: null,
    sale_price_krw: null,
    price_text: "",
    purchase_url: "",
    image_url: "",
    image_file_url: "",
    thumbnail_url: "",
    catalog_url: "",
    catalog_file_url: "",
    catalog_filename: "",
    youtube_url: "",
    headline_text: "",
    urgency_text: "",
    cta_text: "지금 구매하기",
    point_1: "",
    point_2: "",
    point_3: "",
    dealer_apply_url: "",
    buyer_apply_url: "",
    usage_summary: "",
    usage_method: "",
    usage_timing: "",
    usage_interval: "",
    usage_crops: "",
    caution_text: "",
    calc_base_water_liter: null,
    calc_base_product_ml: null,
    calc_base_area_pyeong: null,
    is_active: true,
    status: "active",
    sort_order: null,
    spec: createEmptyProductSpec(),
  };
}

export default function BoothEditorClient({
  booth,
  initialProducts,
}: BoothEditorClientProps) {
  const [form, setForm] = useState<BoothShape>(booth || {});

  const [products, setProducts] = useState<ProductShape[]>(
    normalizeProducts(initialProducts || [])
  );

  const [productForm, setProductForm] = useState<ProductShape>(
    createEmptyProduct(booth?.booth_id)
  );

  const [deletingKey, setDeletingKey] = useState("");

  async function saveBooth(data: BoothShape) {
    const payload = {
      ...data,
      booth_id: data.booth_id,
      boothId: data.booth_id,
      is_active: true,
      is_published: data.is_public === true,
      status: data.is_public ? "published" : "draft",
    };

    const res = await fetch("/api/vendor/booth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    const ok = Boolean(json?.success || json?.ok);

    if (!res.ok || !ok) {
      throw new Error(json?.error || "부스 저장에 실패했습니다.");
    }

    setForm((prev) => ({
      ...prev,
      ...payload,
    }));
  }

  async function saveProduct(data: ProductShape) {
    if (!form.booth_id) {
      throw new Error("먼저 부스를 저장해 주세요.");
    }

    const payload = {
      ...data,
      booth_id: form.booth_id,
      boothId: form.booth_id,
      is_active: data.is_active !== false,
      status: data.status || "active",
    };

    const res = await fetch("/api/vendor/products/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    const ok = Boolean(json?.success || json?.ok);
    const saved = (json?.item ?? json?.product ?? null) as ProductShape | null;

    if (!res.ok || !ok || !saved) {
      throw new Error(json?.error || "제품 저장에 실패했습니다.");
    }

    const normalizedSaved = normalizeProduct(saved);
    const savedKey = String(normalizedSaved.product_id ?? normalizedSaved.id ?? "");

    setProducts((prev) => {
      const exists = prev.some(
        (p) => String(p.product_id ?? p.id ?? "") === savedKey
      );

      const next = exists
        ? prev.map((p) =>
            String(p.product_id ?? p.id ?? "") === savedKey ? normalizedSaved : p
          )
        : [normalizedSaved, ...prev];

      return normalizeProducts(next);
    });

    setProductForm(createEmptyProduct(form.booth_id));
  }

  async function deleteProduct(id: string | number) {
    setDeletingKey(String(id));

    try {
      const res = await fetch("/api/vendor/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: id }),
      });

      const json = await res.json().catch(() => null);
      const ok = Boolean(json?.success || json?.ok);

      if (!res.ok || !ok) {
        throw new Error(json?.error || "제품 삭제에 실패했습니다.");
      }

      setProducts((prev) =>
        normalizeProducts(
          prev.filter(
            (p) => String(p.product_id ?? p.id ?? "") !== String(id)
          )
        )
      );

      if (String(productForm.product_id ?? productForm.id ?? "") === String(id)) {
        setProductForm(createEmptyProduct(form.booth_id));
      }
    } finally {
      setDeletingKey("");
    }
  }

  function editProduct(item: ProductShape) {
    setProductForm(
      normalizeProduct({
        ...item,
        booth_id: form.booth_id || item.booth_id || "",
      })
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={S.page}>
      <BoothBasicForm form={form} setForm={setForm} onSave={saveBooth} />

      <ProductForm
        form={productForm}
        setForm={setProductForm}
        onSave={saveProduct}
      />

      <ProductList
        items={products}
        onEdit={editProduct}
        onDelete={deleteProduct}
        deletingKey={deletingKey}
      />
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
};