"use client";

import UploadBox from "./UploadBox";
import PreviewFile from "./PreviewFile";

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

type Props = {
  productForm: ProductForm;
  setProductForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  saving: boolean;
  handleProductFileUpload: (
    file: File | undefined,
    assetType: "product" | "catalog" | "manual"
  ) => void;
  extractProductByAI: () => void;
};

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none focus:border-green-700";

export default function ProductEditorSection({
  productForm,
  setProductForm,
  saving,
  handleProductFileUpload,
  extractProductByAI,
}: Props) {
  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
      <div className="grid gap-5">
        <UploadBox
          label="제품 이미지 업로드"
          desc="제품 전체가 잘리지 않게 자동 조정됩니다."
          buttonText={
            productForm.image_url
              ? "제품 이미지 다시 업로드"
              : "제품 이미지 선택"
          }
          accept="image/*"
          previewUrl={productForm.image_url}
          onChange={(file) =>
            handleProductFileUpload(file, "product")
          }
        />

        {productForm.image_url ? (
          <PreviewFile
            url={productForm.image_url}
            label="제품 이미지 미리보기"
            onDelete={() =>
              setProductForm((prev) => ({
                ...prev,
                image_url: "",
              }))
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <UploadBox
            label="카탈로그 업로드"
            desc="PDF/JPG/PNG 가능"
            buttonText={
              productForm.catalog_url
                ? "카탈로그 다시 업로드"
                : "카탈로그 선택"
            }
            accept="application/pdf,image/*"
            onChange={(file) =>
              handleProductFileUpload(file, "catalog")
            }
          />

          <UploadBox
            label="사용설명서 업로드"
            desc="PDF/JPG/PNG 가능"
            buttonText={
              productForm.manual_url
                ? "설명서 다시 업로드"
                : "설명서 선택"
            }
            accept="application/pdf,image/*"
            onChange={(file) =>
              handleProductFileUpload(file, "manual")
            }
          />
        </div>

        <Field label="제품명">
          <input
            value={productForm.product_name}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                product_name: e.target.value,
              }))
            }
            className={inputClass}
          />
        </Field>

        <Field label="카테고리">
          <input
            value={productForm.category}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className={inputClass}
          />
        </Field>

        <Field label="한 줄 설명">
          <textarea
            rows={3}
            value={productForm.short_description}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                short_description: e.target.value,
              }))
            }
            className={textareaClass}
          />
        </Field>

        <Field label="유튜브 링크">
          <textarea
            rows={3}
            value={productForm.youtube_urls}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                youtube_urls: e.target.value,
              }))
            }
            className={textareaClass}
          />
        </Field>

        <button
          type="button"
          onClick={extractProductByAI}
          disabled={saving}
          className="rounded-2xl bg-green-700 px-5 py-5 text-xl font-extrabold text-white disabled:opacity-60"
        >
          AI 제품정보 자동 추출
        </button>

        <Field label="제품 상세 설명">
          <textarea
            rows={5}
            value={productForm.detail_description}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                detail_description: e.target.value,
              }))
            }
            className={textareaClass}
          />
        </Field>
      </div>
    </div>
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