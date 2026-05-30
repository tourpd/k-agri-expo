"use client";

import React, { useRef, useState } from "react";
import ProductSpecEditor from "@/components/expo/ProductSpecEditor";
import {
  createEmptyProductSpec,
  type ProductSpecShape,
} from "@/types/expo-product-spec";

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

  purchase_url?: string;
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

type Props = {
  boothId?: string;
  form: ProductShape;
  setForm: React.Dispatch<React.SetStateAction<ProductShape>>;
  onSave: (data: ProductShape) => Promise<void>;
};

function safe(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function trimmed(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function toNullableNumber(v: string) {
  const digits = (v || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  return `${v.toLocaleString("ko-KR")}원`;
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

function normalizeSpec(spec?: ProductSpecShape | null): ProductSpecShape {
  return {
    ...createEmptyProductSpec(),
    ...(spec ?? {}),
  };
}

function syncSpecFromMainForm(product: ProductShape): ProductSpecShape {
  const base = normalizeSpec(product.spec);

  return {
    ...base,
    dilution_ratio_text:
      trimmed(base.dilution_ratio_text, "") ||
      trimmed(product.usage_summary, ""),
    base_water_liter:
      typeof base.base_water_liter === "number"
        ? base.base_water_liter
        : typeof product.calc_base_water_liter === "number"
        ? product.calc_base_water_liter
        : null,
    base_product_amount:
      typeof base.base_product_amount === "number"
        ? base.base_product_amount
        : typeof product.calc_base_product_ml === "number"
        ? product.calc_base_product_ml
        : null,
    base_area_pyeong:
      typeof base.base_area_pyeong === "number"
        ? base.base_area_pyeong
        : typeof product.calc_base_area_pyeong === "number"
        ? product.calc_base_area_pyeong
        : null,
    best_timing_text:
      trimmed(base.best_timing_text, "") || trimmed(product.usage_timing, ""),
    interval_days:
      typeof base.interval_days === "number"
        ? base.interval_days
        : (() => {
            const raw = trimmed(product.usage_interval, "");
            const m = raw.match(/\d+/);
            return m ? Number(m[0]) : null;
          })(),
    target_crops:
      base.target_crops && base.target_crops.length > 0
        ? base.target_crops
        : trimmed(product.usage_crops, "")
            .split(/[,\s/]+/)
            .map((v) => v.trim())
            .filter(Boolean),
    precautions:
      trimmed(base.precautions, "") || trimmed(product.caution_text, ""),
    ai_enabled: typeof base.ai_enabled === "boolean" ? base.ai_enabled : false,
    verified_status: trimmed(base.verified_status, "draft") || "draft",
  };
}

type FieldProps = {
  label: string;
  value: string | number;
  placeholder?: string;
  helpText?: string;
  requiredMark?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  helpText,
  requiredMark = false,
  inputMode,
  onChange,
}: FieldProps) {
  return (
    <label style={S.labelWrap}>
      <div style={S.label}>
        {label}
        {requiredMark ? <span style={S.required}> *</span> : null}
      </div>
      <input
        style={S.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
      {helpText ? <div style={S.helpText}>{helpText}</div> : null}
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  small?: boolean;
  onChange: (value: string) => void;
};

function TextAreaField({
  label,
  value,
  placeholder,
  small = false,
  onChange,
}: TextAreaFieldProps) {
  return (
    <label style={S.labelWrap}>
      <div style={S.label}>{label}</div>
      <textarea
        style={small ? S.textareaSmall : S.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

type UploadFieldProps = {
  label: string;
  uploading: boolean;
  uploadText: string;
  uploadedUrl: string;
  buttonTextBusy: string;
  buttonTextIdle: string;
  fileAccept: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => Promise<void>;
  onUrlChange: (value: string) => void;
};

function UploadField({
  label,
  uploading,
  uploadText,
  uploadedUrl,
  buttonTextBusy,
  buttonTextIdle,
  fileAccept,
  inputRef,
  onPick,
  onUrlChange,
}: UploadFieldProps) {
  return (
    <div style={S.labelWrap}>
      <div style={S.label}>{label}</div>

      <div style={S.uploadRow}>
        <button
          type="button"
          style={uploading ? S.disabledBtn : S.secondaryBtn}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? buttonTextBusy : buttonTextIdle}
        </button>

        {trimmed(uploadedUrl, "") ? (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            style={S.linkBtn}
          >
            업로드 파일 보기
          </a>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={fileAccept}
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await onPick(file);
        }}
      />

      <input
        style={{ ...S.input, marginTop: 8 }}
        value={uploadedUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder={uploadText}
      />
    </div>
  );
}

export default function ProductForm({ boothId, form, setForm, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const catalogInputRef = useRef<HTMLInputElement | null>(null);

  function setField<K extends keyof ProductShape>(key: K, value: ProductShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fillUsageTemplate() {
    setForm((prev) => ({
      ...prev,
      usage_summary: prev.usage_summary || "물 500L 기준 제품 500ml 1병",
      usage_method:
        prev.usage_method ||
        "물에 충분히 희석한 뒤 작물 전체에 고르게 살포하십시오.",
      usage_timing:
        prev.usage_timing || "병해충 초기 또는 작물 스트레스 시작 시 사용",
      usage_interval:
        prev.usage_interval || "7~10일 간격으로 작물 상태를 보며 사용",
      usage_crops: prev.usage_crops || "고추 / 딸기 / 오이 / 엽채류",
      caution_text:
        prev.caution_text ||
        "고온 시간대 살포는 피하고 혼용 전 테스트를 권장합니다.",
      calc_base_water_liter:
        typeof prev.calc_base_water_liter === "number"
          ? prev.calc_base_water_liter
          : 500,
      calc_base_product_ml:
        typeof prev.calc_base_product_ml === "number"
          ? prev.calc_base_product_ml
          : 500,
      spec: {
        ...normalizeSpec(prev.spec),
        dilution_ratio_text:
          prev.spec?.dilution_ratio_text || "물 500L당 500ml 1병",
        base_water_liter:
          typeof prev.spec?.base_water_liter === "number"
            ? prev.spec.base_water_liter
            : 500,
        base_product_amount:
          typeof prev.spec?.base_product_amount === "number"
            ? prev.spec.base_product_amount
            : 500,
        base_product_unit: prev.spec?.base_product_unit || "ml",
        best_timing_text:
          prev.spec?.best_timing_text ||
          "병해충 초기 또는 작물 스트레스 시작 시",
        target_crops:
          prev.spec?.target_crops && prev.spec.target_crops.length > 0
            ? prev.spec.target_crops
            : ["고추", "딸기", "오이", "엽채류"],
        precautions:
          prev.spec?.precautions ||
          "고온 시간대 사용 주의, 혼용 전 테스트 권장",
      },
    }));
  }

  function fillDealerTemplate() {
    setForm((prev) => ({
      ...prev,
      dealer_apply_url: prev.dealer_apply_url || "/expo/partner/dealer",
      buyer_apply_url: prev.buyer_apply_url || "/expo/partner/buyer",
    }));
  }

  async function uploadImageFile(file: File) {
    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");

      const res = await fetch("/api/vendor/assets/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      const ok = Boolean(json?.success || json?.ok);
      const url =
        json?.url ||
        json?.image_url ||
        json?.file_url ||
        json?.asset_url ||
        json?.publicUrl ||
        json?.public_url ||
        json?.file?.url ||
        json?.file?.publicUrl ||
        json?.file?.public_url ||
        "";

      if (!res.ok || !ok || !url) {
        throw new Error(json?.error || "이미지 업로드에 실패했습니다.");
      }

      setForm((prev) => ({
        ...prev,
        image_url: url,
        image_file_url: url,
        thumbnail_url: url,
      }));

      setMessage("제품 이미지가 업로드되었습니다. 제품 저장까지 눌러야 최종 반영됩니다.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "이미지 업로드 중 오류가 발생했습니다."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadCatalogFile(file: File) {
    setUploadingCatalog(true);
    setError("");
    setMessage("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "catalogs");

      const res = await fetch("/api/vendor/assets/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      const ok = Boolean(json?.success || json?.ok);
      const url =
        json?.url ||
        json?.file_url ||
        json?.asset_url ||
        json?.publicUrl ||
        json?.public_url ||
        json?.file?.url ||
        json?.file?.publicUrl ||
        json?.file?.public_url ||
        "";

      if (!res.ok || !ok || !url) {
        throw new Error(json?.error || "카탈로그 업로드에 실패했습니다.");
      }

      setForm((prev) => ({
        ...prev,
        catalog_file_url: url,
        catalog_url: url,
        catalog_filename: file.name,
      }));

      setMessage("카탈로그 파일이 업로드되었습니다. 제품 저장까지 눌러야 최종 반영됩니다.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "카탈로그 업로드 중 오류가 발생했습니다."
      );
    } finally {
      setUploadingCatalog(false);
    }
  }

  async function handleSave() {
    if (saving) return;

    if (!trimmed(form.name, "") && !trimmed(form.title, "")) {
      setError("제품명 또는 제품 제목을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const hasPurchaseUrl = !!trimmed(form.purchase_url, "");
      const hasDealerUrl = !!trimmed(form.dealer_apply_url, "");
      const hasBuyerUrl = !!trimmed(form.buyer_apply_url, "");

      const autoHeadline =
        trimmed(form.headline_text, "") ||
        `${form.name || "이 제품"} 지금 안쓰면 손해입니다`;

      const autoUsage =
        trimmed(form.usage_summary, "") ||
        `물 ${form.calc_base_water_liter || 500}L 기준 ${
          form.calc_base_product_ml || 500
        }ml`;

      const autoCTA =
        trimmed(form.cta_text, "") ||
        (hasPurchaseUrl
          ? "지금 바로 구매하기"
          : hasDealerUrl
          ? "대리점 신청하기"
          : hasBuyerUrl
          ? "바이어 문의하기"
          : "K-Agri Expo에서 주문 문의하기");

      const payload: ProductShape = {
        ...form,
        booth_id: form.booth_id || boothId || "",
        headline_text: autoHeadline,
        usage_summary: autoUsage,
        cta_text: autoCTA,
        spec: syncSpecFromMainForm(form),
      };

      await onSave(payload);

      if (!hasPurchaseUrl && !hasDealerUrl && !hasBuyerUrl) {
        setMessage(
          "제품이 저장되었습니다. 외부 구매 링크가 없으므로 K-Agri Expo 내부 주문/입금 상담형으로 운영됩니다."
        );
      } else {
        setMessage("제품이 저장되었습니다.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "제품 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const discount = discountPercent(form);

  return (
    <section style={S.card}>
      <div style={S.topRow}>
        <div style={S.titleWrap}>
          <h2 style={S.title}>
            {form.product_id || form.id ? "제품 수정" : "새 제품 등록"}
          </h2>
          <div style={S.subTitle}>
            제품 기본정보, 사용기준, 상세기준을 여기서 입력합니다.
          </div>
        </div>

        <div style={S.topBtns}>
          <button type="button" style={S.secondaryBtn} onClick={fillUsageTemplate}>
            사용법 예시 넣기
          </button>
          <button type="button" style={S.secondaryBtn} onClick={fillDealerTemplate}>
            대리점/바이어 링크 예시
          </button>
        </div>
      </div>

      <div style={S.noticeBox}>
        <b>판매 방식 안내</b>
        <br />
        외부 쇼핑몰이 있으면 구매하기 링크를 넣고, 없으면 비워두세요.
        비워두면 K-Agri Expo 내부 주문/계좌입금/토스결제 상담형으로 운영됩니다.
      </div>

      <div style={S.grid2}>
        <Field
          label="제품명"
          value={safe(form.name, "")}
          onChange={(v) => setField("name", v)}
          placeholder="예: 싹쓰리충"
          requiredMark
        />

        <Field
          label="제품 한줄 제목"
          value={safe(form.title, "")}
          onChange={(v) => setField("title", v)}
          placeholder="예: 총채벌레 초기 방제 핵심 제품"
        />

        <Field
          label="정가"
          value={formatMoney(form.price_krw)}
          onChange={(v) => setField("price_krw", toNullableNumber(v))}
          placeholder="예: 70,000원"
          inputMode="numeric"
        />

        <Field
          label="행사가"
          value={formatMoney(form.sale_price_krw)}
          onChange={(v) => setField("sale_price_krw", toNullableNumber(v))}
          placeholder="예: 59,000원"
          inputMode="numeric"
        />

        <Field
          label="구매하기 링크 (선택)"
          value={safe(form.purchase_url, "")}
          onChange={(v) => setField("purchase_url", v)}
          placeholder="외부 쇼핑몰이 있으면 입력"
          helpText="없으면 비워두세요. 내부 주문/계좌입금/토스결제 상담형으로 운영됩니다."
        />

        <Field
          label="제품 영상 링크"
          value={safe(form.youtube_url, "")}
          onChange={(v) => setField("youtube_url", v)}
          placeholder="유튜브 또는 영상 링크"
        />

        <Field
          label="대리점 신청 링크 (선택)"
          value={safe(form.dealer_apply_url, "")}
          onChange={(v) => setField("dealer_apply_url", v)}
          placeholder="대리점 모집용 링크"
        />

        <Field
          label="바이어 문의 링크 (선택)"
          value={safe(form.buyer_apply_url, "")}
          onChange={(v) => setField("buyer_apply_url", v)}
          placeholder="바이어 문의 링크"
        />

        <UploadField
          label="제품 이미지 업로드"
          uploading={uploadingImage}
          uploadText="직접 URL 입력도 가능"
          uploadedUrl={safe(form.image_url, "")}
          buttonTextBusy="이미지 업로드 중..."
          buttonTextIdle="제품 이미지 올리기"
          fileAccept="image/*"
          inputRef={imageInputRef}
          onPick={uploadImageFile}
          onUrlChange={(v) => setField("image_url", v)}
        />

        <UploadField
          label="카탈로그 업로드"
          uploading={uploadingCatalog}
          uploadText="직접 URL 입력도 가능"
          uploadedUrl={safe(form.catalog_file_url, "")}
          buttonTextBusy="카탈로그 업로드 중..."
          buttonTextIdle="카탈로그 파일 올리기"
          fileAccept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,image/*"
          inputRef={catalogInputRef}
          onPick={uploadCatalogFile}
          onUrlChange={(v) => setField("catalog_file_url", v)}
        />

        <Field
          label="강조 문구"
          value={safe(form.headline_text, "")}
          onChange={(v) => setField("headline_text", v)}
          placeholder="예: 총채벌레 초기 대응 추천"
        />

        <Field
          label="행사 배지 문구"
          value={safe(form.urgency_text, "")}
          onChange={(v) => setField("urgency_text", v)}
          placeholder="예: 박람회 특가 / 대리점 모집중"
        />
      </div>

      <div style={S.priceBox}>
        <div style={S.priceCard}>
          <div style={S.priceLabel}>정가</div>
          <div style={S.priceValue}>{formatMoney(form.price_krw) || "-"}</div>
        </div>

        <div style={S.priceCard}>
          <div style={S.priceLabel}>행사가</div>
          <div style={S.priceValueStrong}>
            {formatMoney(form.sale_price_krw) || "-"}
          </div>
        </div>

        <div style={S.priceCardStrong}>
          <div style={S.priceLabel}>할인율</div>
          <div style={S.discountValue}>
            {discount !== null ? `${discount}% 할인` : "-"}
          </div>
        </div>
      </div>

      <TextAreaField
        label="제품 설명"
        value={safe(form.description, "")}
        onChange={(v) => setField("description", v)}
        placeholder="제품 특징 / 장점 / 어떤 농가에 맞는지"
      />

      <div style={S.grid3}>
        <Field
          label="핵심 포인트 1"
          value={safe(form.point_1, "")}
          onChange={(v) => setField("point_1", v)}
          placeholder="예: 활착 촉진"
        />
        <Field
          label="핵심 포인트 2"
          value={safe(form.point_2, "")}
          onChange={(v) => setField("point_2", v)}
          placeholder="예: 초기 생육 회복"
        />
        <Field
          label="핵심 포인트 3"
          value={safe(form.point_3, "")}
          onChange={(v) => setField("point_3", v)}
          placeholder="예: 스트레스 완화"
        />
      </div>

      <div style={S.subSectionTitle}>사용방법 / 사용량 계산 기준</div>
      <div style={S.sectionDesc}>
        여기 입력한 값은 상세 기준에도 함께 반영됩니다.
      </div>

      <div style={S.grid2}>
        <Field
          label="사용 요약"
          value={safe(form.usage_summary, "")}
          onChange={(v) => setField("usage_summary", v)}
          placeholder="예: 물 500L 기준 제품 500ml 1병"
        />
        <Field
          label="사용 가능 작물"
          value={safe(form.usage_crops, "")}
          onChange={(v) => setField("usage_crops", v)}
          placeholder="예: 고추 / 딸기 / 오이 / 엽채류"
        />
        <Field
          label="사용 시기"
          value={safe(form.usage_timing, "")}
          onChange={(v) => setField("usage_timing", v)}
          placeholder="예: 병해충 초기 / 정식 후 / 활착기"
        />
        <Field
          label="사용 간격"
          value={safe(form.usage_interval, "")}
          onChange={(v) => setField("usage_interval", v)}
          placeholder="예: 7~10일 간격"
        />
        <Field
          label="기준 물량 (L)"
          value={form.calc_base_water_liter ?? ""}
          onChange={(v) => setField("calc_base_water_liter", toNullableNumber(v))}
          placeholder="예: 500"
          inputMode="numeric"
        />
        <Field
          label="기준 약량 (ml)"
          value={form.calc_base_product_ml ?? ""}
          onChange={(v) => setField("calc_base_product_ml", toNullableNumber(v))}
          placeholder="예: 500"
          inputMode="numeric"
        />
        <Field
          label="기준 면적 (평)"
          value={form.calc_base_area_pyeong ?? ""}
          onChange={(v) => setField("calc_base_area_pyeong", toNullableNumber(v))}
          placeholder="예: 200"
          inputMode="numeric"
        />
      </div>

      <TextAreaField
        label="사용 방법 상세"
        value={safe(form.usage_method, "")}
        onChange={(v) => setField("usage_method", v)}
        placeholder="예: 물에 충분히 희석 후 작물 전체에 고르게 살포"
        small
      />

      <TextAreaField
        label="주의사항"
        value={safe(form.caution_text, "")}
        onChange={(v) => setField("caution_text", v)}
        placeholder="예: 고온 시간대 살포 주의 / 혼용 전 테스트 권장"
        small
      />

      <div style={S.infoBox}>
        기준이 <b>물 {form.calc_base_water_liter ?? "-"}L</b> 에{" "}
        <b>제품 {form.calc_base_product_ml ?? "-"}ml</b> 라면,
        농민은 자기 물 사용량만 넣어서 필요한 양을 계산할 수 있습니다.
      </div>

      <ProductSpecEditor
        value={form.spec ?? createEmptyProductSpec()}
        onChange={(next) => setField("spec", next)}
      />

      {error ? <div style={S.error}>{error}</div> : null}
      {message ? <div style={S.success}>{message}</div> : null}

      <div style={S.submitRow}>
        <button
          type="button"
          disabled={saving}
          style={saving ? S.disabledBtn : S.saveBtn}
          onClick={handleSave}
        >
          {saving ? "저장 중..." : "제품 저장"}
        </button>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid #e5e7eb",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  titleWrap: {},

  title: {
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
    color: "#111827",
  },

  subTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },

  topBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  noticeBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 700,
  },

  helpText: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.6,
  },

  required: {
    color: "#dc2626",
    fontWeight: 900,
  },

  sectionDesc: {
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#64748b",
  },

  subSectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
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
    boxSizing: "border-box",
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
    boxSizing: "border-box",
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
    boxSizing: "border-box",
  },

  uploadRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
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

  linkBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  },

  disabledBtn: {
    height: 52,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "not-allowed",
  },

  submitRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
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
    fontWeight: 900,
    color: "#111827",
  },

  priceValueStrong: {
    fontSize: 26,
    fontWeight: 900,
    color: "#dc2626",
  },

  discountValue: {
    fontSize: 24,
    fontWeight: 900,
    color: "#dc2626",
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