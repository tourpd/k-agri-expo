"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ProductForm, {
  type ProductFormValue,
} from "@/components/admin/products/ProductForm";

import {
  parseWonInput,
} from "@/lib/formatters";

const EMPTY_FORM: ProductFormValue = {
  name: "",
  slug: "",
  company_name: "",
  vendor_target: "",
  product_group: "material",
  source_type: "admin",
  product_type: "",
  price_krw: "",
  shipping_fee_krw: "3000",
  volume_text: "",
  unit_label: "병",
  coverage_per_unit: "",
  usage_text: "",
  caution_text: "",
  crop_tags: "",
  issue_tags: "",
  channel_tags: "",
  image_url: "",
  is_photodoctor_recommended: false,
  is_booth_product: false,
  is_booth_plan: false,
  is_featured: false,
  active: true,
};

function csvToArray(v: string) {
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminProductNewPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProductFormValue>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function updateForm(key: keyof ProductFormValue, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/products/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "이미지 업로드 실패");
      return;
    }

    setForm((prev) => ({
      ...prev,
      image_url: data.url || data.image_url || "",
    }));
  }

  async function createProduct() {
    if (!form.name.trim()) {
      alert("상품명을 입력하세요.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        price_krw: parseWonInput(form.price_krw),
        shipping_fee_krw: parseWonInput(form.shipping_fee_krw),
        coverage_per_unit: Number(form.coverage_per_unit || 0),
        crop_tags: csvToArray(form.crop_tags),
        issue_tags: csvToArray(form.issue_tags),
        channel_tags: csvToArray(form.channel_tags),
        is_booth_product: form.product_group === "booth_product",
        is_booth_plan: form.product_group === "booth_plan",
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "상품 등록 실패");
        return;
      }

      alert("상품이 등록되었습니다.");
      router.push("/admin/products");
    } catch {
      alert("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-950 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">
            NEW PRODUCT
          </div>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            새 상품 등록
          </h1>

          <p className="mt-2 text-base font-bold text-slate-600 md:text-lg">
            관리자 상품을 직접 등록하거나, 업체 업로드 상품을 보완 등록합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="h-14 rounded-2xl bg-slate-950 px-6 text-base font-black text-white"
        >
          목록으로 돌아가기
        </button>
      </div>

      <ProductForm
        form={form}
        saving={saving}
        submitLabel="상품 등록"
        onChange={updateForm}
        onUploadImage={uploadImage}
        onSubmit={createProduct}
        onCancel={() => router.push("/admin/products")}
      />
    </main>
  );
}