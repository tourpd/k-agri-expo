"use client";

import {
  formatWonInput,
  parseWonInput,
} from "@/lib/formatters";

export type ProductFormValue = {
  name: string;
  slug: string;
  company_name: string;
  vendor_target: string;
  product_group: string;
  source_type: string;
  product_type: string;
  price_krw: string;
  shipping_fee_krw: string;
  volume_text: string;
  unit_label: string;
  coverage_per_unit: string;
  usage_text: string;
  caution_text: string;
  crop_tags: string;
  issue_tags: string;
  channel_tags: string;
  image_url: string;
  is_photodoctor_recommended: boolean;
  is_booth_product: boolean;
  is_booth_plan: boolean;
  is_featured: boolean;
  active: boolean;
};

type Props = {
  form: ProductFormValue;
  saving?: boolean;
  submitLabel: string;
  onChange: (key: keyof ProductFormValue, value: string | boolean) => void;
  onUploadImage: (file: File) => Promise<void>;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function ProductForm({
  form,
  saving = false,
  submitLabel,
  onChange,
  onUploadImage,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm md:p-7">
      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4 md:p-5">
          <div className="mb-3 text-xl font-black">상품 이미지</div>

          {form.image_url ? (
            <img
              src={form.image_url}
              alt="상품 이미지"
              className="h-[220px] w-full rounded-3xl border bg-white object-contain md:h-[320px]"
            />
          ) : (
            <div className="flex h-[220px] w-full items-center justify-center rounded-3xl bg-slate-200 text-lg font-black text-slate-500 md:h-[320px]">
              이미지 없음
            </div>
          )}

          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (file) {
                  await onUploadImage(file);
                }
              }}
              className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-base font-bold"
            />
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-slate-600">
            업체가 올린 이미지나 AI가 추출한 대표 이미지를 여기서 확인하고 교체합니다.
          </div>
        </div>

        <div className="rounded-3xl border-2 border-slate-200 p-4 md:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black text-emerald-700">
                REVIEW
              </div>

              <div className="mt-1 text-2xl font-black">
                상품 검수 정보
              </div>
            </div>

            <StatusBadge active={form.active} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="상품명"
              value={form.name}
              onChange={(v) => onChange("name", v)}
            />

            <Field
              label="업체명"
              value={form.company_name}
              onChange={(v) => onChange("company_name", v)}
            />

            <SelectField
              label="상품 구분"
              value={form.product_group}
              onChange={(v) => onChange("product_group", v)}
              options={[
                { value: "material", label: "농자재" },
                { value: "booth_product", label: "업체 판매상품" },
                { value: "booth_plan", label: "입점상품" },
                { value: "event", label: "경품/프로모션" },
                { value: "consulting", label: "상담상품" },
              ]}
            />

            <SelectField
              label="등록 출처"
              value={form.source_type}
              onChange={(v) => onChange("source_type", v)}
              options={[
                { value: "admin", label: "관리자 등록" },
                { value: "vendor", label: "업체 업로드" },
                { value: "system", label: "시스템 생성" },
              ]}
            />

            <MoneyField
              label="판매가"
              value={form.price_krw}
              onChange={(v) => onChange("price_krw", v)}
            />

            <MoneyField
              label="배송비"
              value={form.shipping_fee_krw}
              onChange={(v) => onChange("shipping_fee_krw", v)}
            />

            <Field
              label="용량"
              value={form.volume_text}
              onChange={(v) => onChange("volume_text", v)}
            />

            <Field
              label="제품 유형"
              value={form.product_type}
              onChange={(v) => onChange("product_type", v)}
              placeholder="예: 살충제 / 살균제 / 영양제"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 md:p-6">
        <div className="mb-4 text-2xl font-black">AI 추출·분류 결과</div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="작물 태그"
            value={form.crop_tags}
            onChange={(v) => onChange("crop_tags", v)}
            placeholder="예: 고추,토마토,오이"
          />

          <Field
            label="병해충/문제 태그"
            value={form.issue_tags}
            onChange={(v) => onChange("issue_tags", v)}
            placeholder="예: 총채벌레,응애,노균병"
          />

          <Field
            label="노출 채널 태그"
            value={form.channel_tags}
            onChange={(v) => onChange("channel_tags", v)}
            placeholder="예: photodoctor,expo"
          />
        </div>

        <p className="mt-4 text-base font-bold text-blue-900">
          업체가 올린 카탈로그·설명서에서 추출된 태그를 관리자가 최종 확인하는 영역입니다.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextArea
          label="사용법"
          value={form.usage_text}
          onChange={(v) => onChange("usage_text", v)}
        />

        <TextArea
          label="주의사항"
          value={form.caution_text}
          onChange={(v) => onChange("caution_text", v)}
        />
      </div>

      <div className="mb-8 rounded-3xl border-2 border-slate-200 p-4 md:p-6">
        <div className="mb-5 text-2xl font-black">노출·승인 설정</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Check
            label="포토닥터 추천 상품"
            checked={form.is_photodoctor_recommended}
            onChange={(v) => onChange("is_photodoctor_recommended", v)}
          />

          <Check
            label="업체 판매상품"
            checked={form.is_booth_product}
            onChange={(v) => onChange("is_booth_product", v)}
          />

          <Check
            label="입점상품"
            checked={form.is_booth_plan}
            onChange={(v) => onChange("is_booth_plan", v)}
          />

          <Check
            label="대표 노출"
            checked={form.is_featured}
            onChange={(v) => onChange("is_featured", v)}
          />

          <Check
            label="승인/노출"
            checked={form.active}
            onChange={(v) => onChange("active", v)}
          />
        </div>
      </div>

      <details className="mb-8 rounded-3xl border-2 border-slate-200 bg-slate-50 p-4 md:p-5">
        <summary className="cursor-pointer text-xl font-black">
          운영자 고급 정보
        </summary>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="slug"
            value={form.slug}
            onChange={(v) => onChange("slug", v)}
          />

          <Field
            label="업체 코드"
            value={form.vendor_target}
            onChange={(v) => onChange("vendor_target", v)}
          />

          <Field
            label="단위"
            value={form.unit_label}
            onChange={(v) => onChange("unit_label", v)}
          />

          <Field
            label="기준 평수"
            value={form.coverage_per_unit}
            onChange={(v) => onChange("coverage_per_unit", v)}
            inputMode="numeric"
          />

          <Field
            label="이미지 URL"
            value={form.image_url}
            onChange={(v) => onChange("image_url", v)}
          />
        </div>
      </details>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-3 border-t-2 border-slate-200 bg-white p-4 shadow-lg md:mx-0 md:flex-row md:rounded-3xl md:border-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="h-16 rounded-2xl bg-emerald-700 px-10 text-xl font-black text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="h-16 rounded-2xl bg-slate-300 px-10 text-xl font-black"
        >
          취소
        </button>
      </div>
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-5 py-3 text-base font-black ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "승인/노출" : "숨김"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <div className="mb-2 text-base font-black">{label}</div>

      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-2xl border-2 border-slate-300 px-4 text-lg font-bold outline-none focus:border-emerald-600"
      />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-base font-black">{label}</div>

      <input
        value={formatWonInput(value)}
        inputMode="numeric"
        placeholder="예: 30,000"
        onChange={(e) => {
          const rawNumber = parseWonInput(e.target.value);
          onChange(String(rawNumber));
        }}
        className="h-14 w-full rounded-2xl border-2 border-slate-300 px-4 text-lg font-bold outline-none focus:border-emerald-600"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="mb-2 text-base font-black">{label}</div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-2xl border-2 border-slate-300 px-4 text-lg font-bold outline-none focus:border-emerald-600"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-base font-black">{label}</div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[150px] w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-600"
      />
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-16 items-center gap-3 rounded-2xl bg-slate-100 px-5 py-4 text-lg font-black">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />

      {label}
    </label>
  );
}