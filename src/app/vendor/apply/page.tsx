"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BoothType = "free" | "basic" | "premium";
type DurationKey = "1m" | "3m";

type ProductCode =
  | "free_1m"
  | "basic_1m"
  | "basic_3m"
  | "premium_1m"
  | "premium_3m";

type PlacementPreference =
  | "category_cluster"
  | "problem_solution"
  | "crop_focused"
  | "new_product_first"
  | "operator_recommended";

type PromotionPreference =
  | "standard"
  | "new_product"
  | "live_feature"
  | "deal_focus"
  | "kftv_pick";

type HallCode =
  | "agri_inputs"
  | "machinery"
  | "seeds_seedlings"
  | "smart_farm"
  | "eco_friendly"
  | "future_insect";

type CategoryCode =
  | "fertilizer"
  | "pesticide"
  | "soil_conditioner"
  | "seed"
  | "seedling"
  | "machinery"
  | "facility"
  | "smart_farm"
  | "eco_friendly"
  | "insect_food"
  | "insect_bio"
  | "other";

type FormState = {
  company_name: string;
  representative_name: string;
  email: string;
  phone: string;
  tax_email: string;
  business_number: string;
  open_date: string;
  business_address: string;
  biz_type: string;
  biz_item: string;
  category_primary: string;
  company_intro: string;
  website_url: string;
  youtube_url: string;
  brochure_url: string;
  source_file_name: string;
  source_file_mime: string;
  source_extracted_json: Record<string, unknown> | null;

  preferred_hall_1: HallCode | "";
  preferred_hall_2: HallCode | "";
  preferred_category: CategoryCode | "";
  placement_preference: PlacementPreference;
  promotion_preference: PromotionPreference;
};

const OPERATIONS = {
  bankAccount: "기업은행 466-072683-04-011",
  phone: "010-8216-1253",
  email: "tourpd70@gmail.com",
};

const BOOTH_META: Record<
  BoothType,
  { title: string; description: string; badge: string }
> = {
  free: {
    title: "무료 체험",
    description: "1개월 동안 K-Agri Expo 입점 흐름을 체험해보는 기본 플랜",
    badge: "무료",
  },
  basic: {
    title: "일반 부스",
    description: "상품/회사 소개와 기본 입점 운영에 적합한 표준 플랜",
    badge: "기본",
  },
  premium: {
    title: "프리미엄 부스",
    description: "상단 노출과 강화된 소개 구성이 가능한 확장 플랜",
    badge: "추천",
  },
};

const PRICE_MAP: Record<
  ProductCode,
  {
    booth_type: BoothType;
    duration_key: DurationKey;
    duration_months: number;
    amount_krw: number;
    label: string;
  }
> = {
  free_1m: {
    booth_type: "free",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 0,
    label: "무료 체험 · 1개월",
  },
  basic_1m: {
    booth_type: "basic",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 50000,
    label: "일반 부스 · 1개월",
  },
  basic_3m: {
    booth_type: "basic",
    duration_key: "3m",
    duration_months: 3,
    amount_krw: 120000,
    label: "일반 부스 · 3개월",
  },
  premium_1m: {
    booth_type: "premium",
    duration_key: "1m",
    duration_months: 1,
    amount_krw: 150000,
    label: "프리미엄 부스 · 1개월",
  },
  premium_3m: {
    booth_type: "premium",
    duration_key: "3m",
    duration_months: 3,
    amount_krw: 350000,
    label: "프리미엄 부스 · 3개월",
  },
};

const HALL_OPTIONS: { value: HallCode; label: string }[] = [
  { value: "agri_inputs", label: "농자재관" },
  { value: "machinery", label: "농기계관" },
  { value: "seeds_seedlings", label: "종자·묘종관" },
  { value: "smart_farm", label: "스마트팜관" },
  { value: "eco_friendly", label: "친환경관" },
  { value: "future_insect", label: "미래 곤충관" },
];

const CATEGORY_OPTIONS: { value: CategoryCode; label: string }[] = [
  { value: "fertilizer", label: "비료·영양제" },
  { value: "pesticide", label: "병해충·방제자재" },
  { value: "soil_conditioner", label: "토양개량·활력제" },
  { value: "seed", label: "종자" },
  { value: "seedling", label: "묘종" },
  { value: "machinery", label: "농기계" },
  { value: "facility", label: "시설·하우스 자재" },
  { value: "smart_farm", label: "스마트농업·센서·AI" },
  { value: "eco_friendly", label: "친환경·유기농자재" },
  { value: "insect_food", label: "식용곤충·곤충소재 식품" },
  { value: "insect_bio", label: "곤충기반 바이오소재" },
  { value: "other", label: "기타" },
];

const PLACEMENT_OPTIONS: {
  value: PlacementPreference;
  title: string;
  desc: string;
}[] = [
  {
    value: "category_cluster",
    title: "동종 카테고리 묶음",
    desc: "비슷한 제품군 안에서 함께 비교 노출",
  },
  {
    value: "problem_solution",
    title: "문제해결형 노출",
    desc: "병해충·비대·생육 문제 중심으로 연결 노출",
  },
  {
    value: "crop_focused",
    title: "작물별 집중 노출",
    desc: "작물관 안에서 우선 노출",
  },
  {
    value: "new_product_first",
    title: "신제품 우선 노출",
    desc: "신제품/신기술 중심으로 먼저 보이기",
  },
  {
    value: "operator_recommended",
    title: "운영팀 추천 배치",
    desc: "운영 목적에 맞게 가장 적합한 위치에 배치",
  },
];

const PROMOTION_OPTIONS: {
  value: PromotionPreference;
  title: string;
  desc: string;
}[] = [
  {
    value: "standard",
    title: "기본 노출",
    desc: "일반 부스 소개 중심",
  },
  {
    value: "new_product",
    title: "신제품 강조",
    desc: "신제품/출시 소식 중심",
  },
  {
    value: "live_feature",
    title: "라이브 소개 희망",
    desc: "라이브쇼 연계 노출 희망",
  },
  {
    value: "deal_focus",
    title: "특가 중심",
    desc: "행사 특가·프로모션 강조",
  },
  {
    value: "kftv_pick",
    title: "한국농수산TV 추천관 희망",
    desc: "콘텐츠 연계 강조 노출 희망",
  },
];

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getProductCode(
  boothType: BoothType | null,
  durationKey: DurationKey | null
): ProductCode | null {
  if (!boothType || !durationKey) return null;
  if (boothType === "free") return "free_1m";
  if (boothType === "basic" && durationKey === "1m") return "basic_1m";
  if (boothType === "basic" && durationKey === "3m") return "basic_3m";
  if (boothType === "premium" && durationKey === "1m") return "premium_1m";
  if (boothType === "premium" && durationKey === "3m") return "premium_3m";
  return null;
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatBusinessNo(raw: string) {
  const digits = onlyDigits(raw).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
}

function normalizeBusinessNoForSubmit(raw: string) {
  return onlyDigits(raw).slice(0, 10);
}

function formatPhone(raw: string) {
  const digits = onlyDigits(raw).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function normalizePhoneForSubmit(raw: string) {
  return onlyDigits(raw).slice(0, 11);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function hallLabel(value: string) {
  return HALL_OPTIONS.find((item) => item.value === value)?.label ?? value ?? "-";
}

function categoryLabel(value: string) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label ?? value ?? "-";
}

function placementLabel(value: PlacementPreference) {
  return (
    PLACEMENT_OPTIONS.find((item) => item.value === value)?.title ?? value ?? "-"
  );
}

function promotionLabel(value: PromotionPreference) {
  return (
    PROMOTION_OPTIONS.find((item) => item.value === value)?.title ?? value ?? "-"
  );
}

export default function VendorApplyPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [boothType, setBoothType] = useState<BoothType | null>(null);
  const [durationKey, setDurationKey] = useState<DurationKey | null>(null);

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [businessLicenseBucket, setBusinessLicenseBucket] = useState("");
  const [businessLicensePath, setBusinessLicensePath] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [form, setForm] = useState<FormState>({
    company_name: "",
    representative_name: "",
    email: "",
    phone: "",
    tax_email: "",
    business_number: "",
    open_date: "",
    business_address: "",
    biz_type: "",
    biz_item: "",
    category_primary: "",
    company_intro: "",
    website_url: "",
    youtube_url: "",
    brochure_url: "",
    source_file_name: "",
    source_file_mime: "",
    source_extracted_json: null,

    preferred_hall_1: "agri_inputs",
    preferred_hall_2: "",
    preferred_category: "fertilizer",
    placement_preference: "category_cluster",
    promotion_preference: "standard",
  });

  useEffect(() => {
    return () => {
      if (licensePreviewUrl) URL.revokeObjectURL(licensePreviewUrl);
    };
  }, [licensePreviewUrl]);

  const productCode = useMemo(
    () => getProductCode(boothType, durationKey),
    [boothType, durationKey]
  );

  const selectedPlan = productCode ? PRICE_MAP[productCode] : null;

  const availableDurations: DurationKey[] = useMemo(() => {
    if (boothType === "free") return ["1m"];
    if (boothType === "basic") return ["1m", "3m"];
    if (boothType === "premium") return ["1m", "3m"];
    return [];
  }, [boothType]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetBusinessLicenseUpload() {
    setLicenseFile(null);
    setBusinessLicenseBucket("");
    setBusinessLicensePath("");
    setUploadMessage("");
    setSubmitMessage("");

    updateForm("source_file_name", "");
    updateForm("source_file_mime", "");
    updateForm("source_extracted_json", null);

    if (licensePreviewUrl) {
      URL.revokeObjectURL(licensePreviewUrl);
    }
    setLicensePreviewUrl("");
    setFileInputKey((prev) => prev + 1);
  }

  function goNextFromStep1() {
    setSubmitMessage("");

    if (!boothType) {
      alert("부스 유형을 먼저 선택해주세요.");
      return;
    }

    if (boothType === "free") {
      setDurationKey("1m");
    } else if (!durationKey) {
      setDurationKey("1m");
    }

    setStep(2);
  }

  function goNextFromStep2() {
    setSubmitMessage("");

    if (!boothType) {
      alert("부스 유형을 먼저 선택해주세요.");
      return;
    }

    if (!durationKey) {
      alert("기간을 선택해주세요.");
      return;
    }

    setStep(3);
  }

  async function handleUploadBusinessLicense() {
    if (!licenseFile) {
      alert("사업자등록증 파일을 먼저 선택해주세요.");
      return;
    }

    setIsUploadingLicense(true);
    setUploadMessage("");
    setSubmitMessage("");

    try {
      const fd = new FormData();
      fd.append("file", licenseFile);

      const res = await fetch("/api/vendor/upload-business-license", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.detail || json?.error || "사업자등록증 업로드에 실패했습니다."
        );
      }

      setBusinessLicenseBucket(json.bucket || "");
      setBusinessLicensePath(json.path || "");
      updateForm("source_file_name", json.fileName || licenseFile.name);
      updateForm("source_file_mime", json.mimeType || licenseFile.type || "");
      updateForm("source_extracted_json", null);
      setUploadMessage("사업자등록증 파일 업로드가 완료되었습니다.");
    } catch (error) {
      setUploadMessage(
        error instanceof Error
          ? error.message
          : "사업자등록증 업로드에 실패했습니다."
      );
    } finally {
      setIsUploadingLicense(false);
    }
  }

  function goNextFromStep3() {
    setSubmitMessage("");

    if (!licenseFile) {
      alert("사업자등록증 이미지를 선택해주세요.");
      return;
    }

    if (!businessLicenseBucket || !businessLicensePath) {
      alert("사업자등록증 파일 업로드를 먼저 완료해주세요.");
      return;
    }

    if (!form.company_name.trim()) {
      alert("회사명은 필수입니다.");
      return;
    }

    if (!form.representative_name.trim()) {
      alert("대표자명은 필수입니다.");
      return;
    }

    const normalizedBizNo = normalizeBusinessNoForSubmit(form.business_number);
    if (normalizedBizNo.length !== 10) {
      alert("사업자등록번호를 정확히 입력해주세요.");
      return;
    }

    if (!form.business_address.trim()) {
      alert("사업장 주소는 필수입니다.");
      return;
    }

    if (!form.biz_type.trim()) {
      alert("업태는 필수입니다.");
      return;
    }

    if (!form.biz_item.trim()) {
      alert("종목은 필수입니다.");
      return;
    }

    if (!form.email.trim()) {
      alert("담당자 이메일은 필수입니다.");
      return;
    }

    if (!isValidEmail(form.email)) {
      alert("담당자 이메일 형식을 확인해주세요.");
      return;
    }

    if (form.tax_email.trim() && !isValidEmail(form.tax_email)) {
      alert("세금계산서 이메일 형식을 확인해주세요.");
      return;
    }

    const normalizedPhone = normalizePhoneForSubmit(form.phone);
    if (normalizedPhone.length < 10) {
      alert("담당자 연락처를 정확히 입력해주세요.");
      return;
    }

    if (!form.preferred_hall_1) {
      alert("희망 관 1순위를 선택해주세요.");
      return;
    }

    if (!form.preferred_category) {
      alert("희망 카테고리를 선택해주세요.");
      return;
    }

    if (
      form.preferred_hall_2 &&
      form.preferred_hall_1 &&
      form.preferred_hall_1 === form.preferred_hall_2
    ) {
      alert("희망 관 1순위와 2순위는 다르게 선택해주세요.");
      return;
    }

    if (!form.placement_preference) {
      alert("희망 노출 구조를 선택해주세요.");
      return;
    }

    if (!form.promotion_preference) {
      alert("홍보 선호 방식을 선택해주세요.");
      return;
    }

    setStep(4);
  }

  async function handleSubmit() {
    if (!productCode || !selectedPlan || !boothType || !durationKey) {
      alert("상품 정보가 올바르지 않습니다.");
      return;
    }

    if (!businessLicenseBucket || !businessLicensePath) {
      alert("사업자등록증 업로드 정보가 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const normalizedPhone = normalizePhoneForSubmit(form.phone);

      const normalizedTaxEmail = form.tax_email.trim() || form.email.trim();

      const normalizedBizType = form.biz_type.trim() || "기타";

      const normalizedBizItem =
        form.biz_item.trim() ||
        normalizedBizType ||
        form.category_primary.trim() ||
        form.preferred_category ||
        "기타";

      const normalizedCategoryPrimary =
        form.category_primary.trim() || form.preferred_category || "other";

      const normalizedCompanyIntro =
        form.company_intro.trim() || "회사 소개 미입력";

      const payload = {
        booth_type: boothType,
        duration_key: selectedPlan.duration_key,
        duration_months: selectedPlan.duration_months,
        amount_krw: selectedPlan.amount_krw,
        product_code: productCode,
        plan_code: productCode,

        company_name: form.company_name.trim(),
        representative_name: form.representative_name.trim(),
        ceo_name: form.representative_name.trim(),
        contact_name: form.representative_name.trim(),

        email: form.email.trim(),
        contact_email: form.email.trim(),
        phone: normalizedPhone,
        contact_phone: normalizedPhone,
        tax_email: normalizedTaxEmail,

        business_number: normalizeBusinessNoForSubmit(form.business_number),
        open_date: form.open_date.trim(),
        business_address: form.business_address.trim(),

        biz_type: normalizedBizType,
        business_type: normalizedBizType,
        biz_item: normalizedBizItem,
        business_item: normalizedBizItem,

        category_primary: normalizedCategoryPrimary,
        company_intro: normalizedCompanyIntro,

        website_url: form.website_url.trim(),
        youtube_url: form.youtube_url.trim(),
        brochure_url: form.brochure_url.trim(),

        preferred_hall_1: form.preferred_hall_1,
        preferred_hall_2: form.preferred_hall_2 || null,
        preferred_category: form.preferred_category,
        placement_preference: form.placement_preference,
        promotion_preference: form.promotion_preference,

        source_file_name: form.source_file_name,
        source_file_mime: form.source_file_mime,
        source_extracted_json: form.source_extracted_json,

        business_license_bucket: businessLicenseBucket,
        business_license_path: businessLicensePath,
      };

      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !(json?.success || json?.ok)) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "입점 신청 저장 중 오류가 발생했습니다."
        );
      }

      const applicationId =
        json.application_id ??
        json.application?.application_id ??
        json.application?.id ??
        "";

      const applicationCode =
        json.application_code ??
        json.application?.application_code ??
        json.application?.order_code ??
        json.order_code ??
        "";

      const companyName =
        json.company_name ??
        json.application?.company_name ??
        form.company_name.trim();

      const params = new URLSearchParams({
        application_id: String(applicationId),
        application_code: String(applicationCode),
        company_name: String(companyName),
        booth_type: String(boothType || ""),
        duration_key: String(selectedPlan.duration_key || durationKey || ""),
        amount_krw: String(json.amount_krw ?? selectedPlan.amount_krw ?? 0),
        phone: normalizedPhone,
      });

      router.push(`/vendor/apply/complete?${params.toString()}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "신청 제출에 실패했습니다.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          K-Agri Expo 벤더 입점 신청
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          부스 선택 → 기간 선택 → 사업자등록증 업로드 및 정보 입력 → 최종 확인 → 제출
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => {
          const active = step === n;
          const done = step > n;

          return (
            <div
              key={n}
              className={`rounded-2xl border p-4 text-sm ${
                active
                  ? "border-black bg-black text-white"
                  : done
                  ? "border-neutral-300 bg-neutral-100"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="font-semibold">STEP {n}</div>
              <div className="mt-1">
                {n === 1 && "부스 선택"}
                {n === 2 && "기간 선택"}
                {n === 3 && "사업자정보 입력"}
                {n === 4 && "최종 확인"}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-sm text-neutral-500">현재 선택</div>
          <div className="mt-1 text-lg font-semibold">{selectedPlan.label}</div>
          <div className="mt-1 text-sm text-neutral-700">
            결제 예정 금액:{" "}
            <span className="font-semibold">
              {formatKrw(selectedPlan.amount_krw)}
            </span>
          </div>
        </div>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">1. 부스 유형을 선택해주세요</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(BOOTH_META) as BoothType[]).map((type) => {
              const meta = BOOTH_META[type];
              const selected = boothType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSubmitMessage("");
                    setBoothType(type);
                    if (type === "free") {
                      setDurationKey("1m");
                    } else if (!durationKey) {
                      setDurationKey("1m");
                    }
                  }}
                  className={`rounded-3xl border p-6 text-left transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="mb-3 inline-block rounded-full border px-3 py-1 text-xs">
                    {meta.badge}
                  </div>
                  <div className="text-xl font-bold">{meta.title}</div>
                  <div className="mt-3 text-sm opacity-90">
                    {meta.description}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNextFromStep1}
              className="rounded-2xl bg-black px-5 py-3 text-white"
            >
              다음 단계
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">2. 기간을 선택해주세요</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {availableDurations.map((key) => {
              const code = getProductCode(boothType, key);
              if (!code) return null;
              const plan = PRICE_MAP[code];
              const selected = durationKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSubmitMessage("");
                    setDurationKey(key);
                  }}
                  className={`rounded-3xl border p-6 text-left transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="text-lg font-bold">{plan.label}</div>
                  <div className="mt-2 text-sm">
                    기간: {plan.duration_months}개월
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {formatKrw(plan.amount_krw)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-2xl border border-neutral-300 px-5 py-3"
            >
              이전
            </button>
            <button
              type="button"
              onClick={goNextFromStep2}
              className="rounded-2xl bg-black px-5 py-3 text-white"
            >
              다음 단계
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">
            3. 사업자등록증 업로드 및 사업자정보 입력
          </h2>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
            <div className="font-bold">입점 신청 안내</div>
            <div className="mt-2">
              1. 사업자등록증 전체가 잘 보이도록 정면에서 촬영하거나 스캔본을 올려주세요.
            </div>
            <div>2. 글자가 흐리거나 빛반사가 심한 이미지는 다시 업로드해 주세요.</div>
            <div>3. JPG, PNG, WEBP 이미지 파일 업로드를 권장합니다.</div>
            <div>4. 잘못 올렸으면 아래에서 다시 선택 후 재업로드하면 됩니다.</div>
            <div>5. 파일 업로드 후 아래 회사 정보는 직접 다시 확인해 주세요.</div>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-6">
            <label className="mb-3 block text-sm font-medium">
              사업자등록증 파일 *
            </label>

            <input
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const nextFile = e.target.files?.[0] || null;

                if (!nextFile) return;

                if (!nextFile.type.startsWith("image/")) {
                  alert("이미지 파일만 업로드할 수 있습니다.");
                  e.currentTarget.value = "";
                  return;
                }

                if (nextFile.size > 10 * 1024 * 1024) {
                  alert("파일 용량은 10MB 이하만 업로드해 주세요.");
                  e.currentTarget.value = "";
                  return;
                }

                setSubmitMessage("");
                setLicenseFile(nextFile);
                setBusinessLicenseBucket("");
                setBusinessLicensePath("");
                setUploadMessage("");

                if (licensePreviewUrl) {
                  URL.revokeObjectURL(licensePreviewUrl);
                  setLicensePreviewUrl("");
                }

                updateForm("source_file_name", nextFile.name);
                updateForm("source_file_mime", nextFile.type || "");
                updateForm("source_extracted_json", null);
                setLicensePreviewUrl(URL.createObjectURL(nextFile));
              }}
              className="block w-full rounded-xl border border-neutral-300 p-3"
            />

            <div className="mt-2 text-sm text-neutral-500">
              사업자등록증은 증빙용으로 업로드됩니다. 핵심 정보는 아래에 직접 입력해주세요.
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUploadBusinessLicense}
                disabled={!licenseFile || isUploadingLicense}
                className="rounded-2xl bg-black px-5 py-3 text-white disabled:opacity-50"
              >
                {isUploadingLicense
                  ? "파일 업로드 중..."
                  : "사업자등록증 업로드"}
              </button>

              <button
                type="button"
                onClick={resetBusinessLicenseUpload}
                className="rounded-2xl border border-neutral-300 px-5 py-3"
              >
                업로드 취소 / 다시 선택
              </button>

              {licenseFile && (
                <div className="self-center text-sm text-neutral-600">
                  선택 파일: {licenseFile.name}
                </div>
              )}
            </div>

            {uploadMessage && (
              <div className="mt-4 rounded-2xl bg-neutral-100 p-4 text-sm whitespace-pre-wrap">
                {uploadMessage}
              </div>
            )}

            {(businessLicenseBucket || businessLicensePath) && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
                업로드 완료되었습니다.
                <br />
                다른 사업자등록증으로 바꾸려면 “업로드 취소 / 다시 선택” 후 다시 업로드해 주세요.
              </div>
            )}

            {licensePreviewUrl && (
              <div className="mt-4 rounded-2xl border border-neutral-200 p-4">
                <div className="mb-2 text-sm font-medium text-neutral-700">
                  업로드 미리보기
                </div>
                <img
                  src={licensePreviewUrl}
                  alt="사업자등록증 미리보기"
                  className="max-h-[520px] w-auto rounded-xl border border-neutral-200"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            사업자등록증 이미지는 나중에 세금계산서 발행 및 운영 확인용으로 보관됩니다.
            회사명, 대표자명, 사업자등록번호, 사업장 주소, 업태, 종목, 담당자 이메일,
            연락처는 직접 정확하게 입력해주세요.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="회사명 *"
              value={form.company_name}
              onChange={(v) => updateForm("company_name", v)}
              placeholder="예: 주식회사 한국농수산티브이"
            />
            <InputField
              label="대표자명 *"
              value={form.representative_name}
              onChange={(v) => updateForm("representative_name", v)}
              placeholder="예: 조세환"
            />
            <InputField
              label="담당자 이메일 *"
              type="email"
              value={form.email}
              onChange={(v) => updateForm("email", v)}
              placeholder="예: tourpd70@gmail.com"
            />
            <InputField
              label="담당자 연락처 *"
              value={form.phone}
              onChange={(v) => updateForm("phone", formatPhone(v))}
              placeholder="숫자만 입력하면 자동으로 -가 들어갑니다"
            />
            <InputField
              label="세금계산서 이메일"
              type="email"
              value={form.tax_email}
              onChange={(v) => updateForm("tax_email", v)}
              placeholder="비어 있으면 담당자 이메일이 자동 사용됩니다"
            />
            <InputField
              label="사업자등록번호 *"
              value={form.business_number}
              onChange={(v) => updateForm("business_number", formatBusinessNo(v))}
              placeholder="숫자만 입력하면 자동으로 -가 들어갑니다"
            />
            <InputField
              label="개업연월일"
              value={form.open_date}
              onChange={(v) => updateForm("open_date", v)}
              placeholder="예: 2025-07-10"
            />
            <InputField
              label="업태 *"
              value={form.biz_type}
              onChange={(v) => updateForm("biz_type", v)}
              placeholder="예: 전자상거래"
            />
            <InputField
              label="종목 *"
              value={form.biz_item}
              onChange={(v) => updateForm("biz_item", v)}
              placeholder="예: 농자재 판매 / 비료 유통 / 온라인 판매"
            />
            <InputField
              label="대표 카테고리"
              value={form.category_primary}
              onChange={(v) => updateForm("category_primary", v)}
              placeholder="예: 농자재 / 비료 / 농기계 / 종자"
            />
          </div>

          <div className="rounded-3xl border border-neutral-200 p-6">
            <div className="mb-4">
              <div className="text-lg font-semibold">
                희망 관 / 카테고리 / 노출 선호
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                온라인 K-Agri Expo에서 어떤 방식으로 보여지길 원하는지 선택하는 항목입니다.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="희망 관 1순위 *"
                value={form.preferred_hall_1}
                onChange={(v) => {
                  updateForm("preferred_hall_1", v as HallCode);
                  if (v === form.preferred_hall_2) {
                    updateForm("preferred_hall_2", "");
                  }
                }}
                options={HALL_OPTIONS}
              />

              <SelectField
                label="희망 관 2순위"
                value={form.preferred_hall_2}
                onChange={(v) => updateForm("preferred_hall_2", v as HallCode | "")}
                options={[
                  { value: "", label: "선택 안 함" },
                  ...HALL_OPTIONS.filter(
                    (item) => item.value !== form.preferred_hall_1
                  ),
                ]}
              />

              <SelectField
                label="희망 카테고리 *"
                value={form.preferred_category}
                onChange={(v) =>
                  updateForm("preferred_category", v as CategoryCode)
                }
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-medium">희망 노출 구조 *</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {PLACEMENT_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.value}
                    selected={form.placement_preference === item.value}
                    title={item.title}
                    desc={item.desc}
                    onClick={() =>
                      updateForm("placement_preference", item.value)
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-medium">홍보 선호 방식 *</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {PROMOTION_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.value}
                    selected={form.promotion_preference === item.value}
                    title={item.title}
                    desc={item.desc}
                    onClick={() =>
                      updateForm("promotion_preference", item.value)
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <TextAreaField
            label="사업장 주소 *"
            value={form.business_address}
            onChange={(v) => updateForm("business_address", v)}
            rows={3}
            placeholder="예: 충청남도 홍성군 홍성읍 내포로251번길 45"
          />

          <TextAreaField
            label="회사 소개"
            value={form.company_intro}
            onChange={(v) => updateForm("company_intro", v)}
            rows={5}
            placeholder="비어 있으면 '회사 소개 미입력'으로 저장됩니다."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <InputField
              label="웹사이트 URL"
              value={form.website_url}
              onChange={(v) => updateForm("website_url", v)}
              placeholder="https://"
            />
            <InputField
              label="유튜브 URL"
              value={form.youtube_url}
              onChange={(v) => updateForm("youtube_url", v)}
              placeholder="https://"
            />
            <InputField
              label="브로슈어 URL"
              value={form.brochure_url}
              onChange={(v) => updateForm("brochure_url", v)}
              placeholder="https://"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-2xl border border-neutral-300 px-5 py-3"
            >
              이전
            </button>
            <button
              type="button"
              onClick={goNextFromStep3}
              className="rounded-2xl bg-black px-5 py-3 text-white"
            >
              최종 확인으로 이동
            </button>
          </div>
        </section>
      )}

      {step === 4 && selectedPlan && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">4. 최종 확인</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <SummaryCard
              title="신청 정보"
              rows={[
                ["부스 유형", BOOTH_META[boothType!].title],
                ["기간", `${selectedPlan.duration_months}개월`],
                ["상품 코드", productCode || "-"],
                ["결제 금액", formatKrw(selectedPlan.amount_krw)],
              ]}
            />

            <SummaryCard
              title="사업자 정보"
              rows={[
                ["회사명", form.company_name || "-"],
                ["대표자명", form.representative_name || "-"],
                ["사업자등록번호", form.business_number || "-"],
                ["개업연월일", form.open_date || "-"],
                ["업태", form.biz_type || "-"],
                ["종목", form.biz_item || form.biz_type || "-"],
                ["사업장 주소", form.business_address || "-"],
              ]}
            />
          </div>

          <SummaryCard
            title="희망 배정 정보"
            rows={[
              ["희망 관 1순위", hallLabel(form.preferred_hall_1)],
              [
                "희망 관 2순위",
                form.preferred_hall_2
                  ? hallLabel(form.preferred_hall_2)
                  : "선택 안 함",
              ],
              ["희망 카테고리", categoryLabel(form.preferred_category)],
              ["희망 노출 구조", placementLabel(form.placement_preference)],
              ["홍보 선호 방식", promotionLabel(form.promotion_preference)],
            ]}
          />

          <SummaryCard
            title="담당자 / 운영 정보"
            rows={[
              ["담당자 이메일", form.email || "-"],
              ["담당자 연락처", form.phone || "-"],
              ["세금계산서 이메일", form.tax_email || form.email || "-"],
              ["사업자등록증 파일", form.source_file_name || "-"],
              ["스토리지 버킷", businessLicenseBucket || "-"],
              ["스토리지 경로", businessLicensePath || "-"],
              ["운영 계좌", OPERATIONS.bankAccount],
              ["문의 전화", OPERATIONS.phone],
              ["문의 이메일", OPERATIONS.email],
            ]}
          />

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-sm leading-7 text-neutral-700">
            {selectedPlan.amount_krw === 0 ? (
              <>무료 체험 신청은 제출 후 운영 검토를 거쳐 진행됩니다.</>
            ) : (
              <>
                유료 부스는 신청 제출 후 아래 계좌로 입금 확인이 되면 승인 절차가 진행됩니다.
                <br />
                <strong>{OPERATIONS.bankAccount}</strong>
              </>
            )}
          </div>

          {submitMessage && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
              {submitMessage}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-2xl border border-neutral-300 px-5 py-3"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-black px-6 py-3 text-white disabled:opacity-50"
            >
              {isSubmitting ? "제출 중..." : "입점 신청 제출"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      />
    </label>
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
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceCard({
  selected,
  title,
  desc,
  onClick,
}: {
  selected: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-black bg-black text-white"
          : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div
        className={`mt-1 text-xs ${
          selected ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        {desc}
      </div>
    </button>
  );
}

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 p-6">
      <div className="mb-4 text-lg font-semibold">{title}</div>
      <div className="space-y-3">
        {rows.map(([k, v], idx) => (
          <div
            key={`${k}-${idx}`}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 text-sm"
          >
            <div className="text-neutral-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-medium">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}