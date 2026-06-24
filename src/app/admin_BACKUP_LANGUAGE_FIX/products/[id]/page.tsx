"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ProductForm, {
  type ProductFormValue,
} from "@/components/admin/products/ProductForm";

import {
  formatWonInput,
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
  shipping_fee_krw: "3,000",

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

function arrayToCsv(v: unknown) {
  if (!Array.isArray(v)) return "";

  return v
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(",");
}

export default function AdminProductEditPage() {
  const router = useRouter();

  const params = useParams();

  const productId = String(params.id || "");

  const [form, setForm] =
    useState<ProductFormValue>(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  function updateForm(
    key: keyof ProductFormValue,
    value: string | boolean
  ) {
    // 금액 자동 콤마 처리
    if (
      key === "price_krw" ||
      key === "shipping_fee_krw"
    ) {
      setForm((prev) => ({
        ...prev,
        [key]: formatWonInput(String(value)),
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function loadProduct() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/products/${productId}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "상품 조회 실패");

        router.push("/admin/products");

        return;
      }

      const p = data.product;

      setForm({
        name: p.name || "",
        slug: p.slug || "",

        company_name:
          p.company_name || "",

        vendor_target:
          p.vendor_target || "",

        product_group:
          p.product_group ||
          "material",

        source_type:
          p.source_type || "admin",

        product_type:
          p.product_type || "",

        // 자동 콤마
        price_krw: formatWonInput(
          String(p.price_krw ?? "")
        ),

        shipping_fee_krw:
          formatWonInput(
            String(
              p.shipping_fee_krw ??
                3000
            )
          ),

        volume_text:
          p.volume_text || "",

        unit_label:
          p.unit_label || "병",

        coverage_per_unit:
          String(
            p.coverage_per_unit ??
              ""
          ),

        usage_text:
          p.usage_text || "",

        caution_text:
          p.caution_text || "",

        crop_tags: arrayToCsv(
          p.crop_tags
        ),

        issue_tags: arrayToCsv(
          p.issue_tags
        ),

        channel_tags:
          arrayToCsv(
            p.channel_tags
          ),

        image_url:
          p.image_url || "",

        is_photodoctor_recommended:
          !!p.is_photodoctor_recommended,

        is_booth_product:
          !!p.is_booth_product,

        is_booth_plan:
          !!p.is_booth_plan,

        is_featured:
          !!p.is_featured,

        active: !!p.active,
      });
    } catch {
      alert("네트워크 오류");

      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (productId) {
      loadProduct();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function uploadImage(file: File) {
    const fd = new FormData();

    fd.append("file", file);

    const res = await fetch(
      "/api/admin/products/upload",
      {
        method: "POST",
        body: fd,
      }
    );

    const data = await res.json();

    if (!data.success) {
      alert(
        data.error ||
          "이미지 업로드 실패"
      );

      return;
    }

    setForm((prev) => ({
      ...prev,
      image_url:
        data.url ||
        data.image_url ||
        "",
    }));
  }

  async function updateProduct() {
    if (!form.name.trim()) {
      alert(
        "상품명을 입력하세요."
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        // 콤마 제거 후 숫자 저장
        price_krw: parseWonInput(
          form.price_krw
        ),

        shipping_fee_krw:
          parseWonInput(
            form.shipping_fee_krw
          ),

        coverage_per_unit:
          Number(
            form.coverage_per_unit ||
              0
          ),

        crop_tags:
          csvToArray(
            form.crop_tags
          ),

        issue_tags:
          csvToArray(
            form.issue_tags
          ),

        channel_tags:
          csvToArray(
            form.channel_tags
          ),

        is_booth_product:
          form.product_group ===
          "booth_product",

        is_booth_plan:
          form.product_group ===
          "booth_plan",
      };

      const res = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.error ||
            "상품 저장 실패"
        );

        return;
      }

      alert(
        "상품 검수/수정이 저장되었습니다."
      );

      router.push(
        "/admin/products"
      );
    } catch {
      alert("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-3xl font-black">
          상품 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-6 text-slate-950">
      {/* 헤더 */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">
            PRODUCT REVIEW
          </div>

          <h1 className="mt-2 text-2xl font-black md:text-4xl">
            상품 검수/수정
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-600 md:text-lg">
            업체가 등록한 상품을 검수하고
            노출 여부를 최종 승인합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/products"
            )
          }
          className="h-14 rounded-2xl bg-slate-950 px-6 text-base font-black text-white"
        >
          목록으로 돌아가기
        </button>
      </div>

      {/* 본문 */}
      <ProductForm
        form={form}
        saving={saving}
        submitLabel="검수 저장"
        onChange={updateForm}
        onUploadImage={uploadImage}
        onSubmit={updateProduct}
        onCancel={() =>
          router.push(
            "/admin/products"
          )
        }
      />
    </main>
  );
}