"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EXPO_HALLS, type ExpoHallId } from "@/lib/expo/hall-config";

type ProductMode =
  | "dose_calculator"
  | "solution"
  | "quote"
  | "reservation"
  | "consulting"
  | "b2b_story";

const HALL_OPTIONS = Object.entries(EXPO_HALLS).map(([id, hall]) => ({
  id: id as ExpoHallId,
  label: hall.label,
  description: hall.description,
  mode: hall.mode as ProductMode,
}));

function modeLabel(mode: ProductMode) {
  switch (mode) {
    case "dose_calculator":
      return "평수별 사용량 계산형";
    case "solution":
      return "문제 해결 솔루션형";
    case "quote":
      return "견적·상담형";
    case "reservation":
      return "예약주문형";
    case "consulting":
      return "도입상담형";
    case "b2b_story":
      return "B2B·스토리형";
    default:
      return "일반형";
  }
}

export default function VendorProductNewPage() {
  const [hallId, setHallId] = useState<ExpoHallId>("crop_nutrition");
  const selectedHall = EXPO_HALLS[hallId];
  const mode = selectedHall.mode as ProductMode;

  const guide = useMemo(() => {
    if (mode === "dose_calculator") {
      return {
        title: "작물영양관 제품 등록",
        desc: "비료·영양제·칼슘제·활력제는 평수별 사용량 계산까지 연결됩니다.",
        fields: [
          "제품명",
          "제품 사진",
          "팜플렛/PDF",
          "희석배수",
          "20L 기준 사용량",
          "1,000평 기준 물량",
          "병/포장 용량",
          "사용 작물",
        ],
      };
    }

    if (mode === "solution") {
      return {
        title: "병해충솔루션관 제품 등록",
        desc: "친환경 방제·유기농자재는 대상 병해충과 등록번호 중심으로 관리합니다.",
        fields: [
          "제품명",
          "제품 사진",
          "팜플렛/PDF",
          "유기농자재 등록번호",
          "대상 병해충",
          "사용 작물",
          "희석배수",
          "사용 시기",
        ],
      };
    }

    if (mode === "quote") {
      return {
        title: "농기계·장비관 등록",
        desc: "농기계는 즉시구매보다 견적·시연·상담 신청 중심으로 운영합니다.",
        fields: [
          "모델명",
          "대표 이미지",
          "카탈로그 PDF",
          "마력/규격",
          "작업폭",
          "권장 면적",
          "보조사업 가능 여부",
          "AS 가능 지역",
        ],
      };
    }

    if (mode === "reservation") {
      return {
        title: "종자·육묘관 등록",
        desc: "품종·파종시기·정식시기·예약주문 중심으로 운영합니다.",
        fields: [
          "품종명",
          "사진",
          "품종 설명서",
          "파종시기",
          "정식시기",
          "수확시기",
          "발아율",
          "예약 가능 수량",
        ],
      };
    }

    if (mode === "consulting") {
      return {
        title: "스마트농업·AI관 등록",
        desc: "설치비·월사용료·지원작물·데모신청 중심으로 운영합니다.",
        fields: [
          "서비스명",
          "대표 이미지",
          "소개서 PDF",
          "설치비",
          "월 사용료",
          "지원 작물",
          "설치 기간",
          "무료 데모 가능 여부",
        ],
      };
    }

    return {
      title: "미래식량·곤충관 등록",
      desc: "곤충 원료·기능성 식품·B2B 납품·스토리 콘텐츠 중심으로 운영합니다.",
      fields: [
        "제품/원료명",
        "대표 이미지",
        "소개서 PDF",
        "원료명",
        "기능성 자료",
        "인증/특허",
        "B2B 납품 가능 여부",
        "OEM 가능 여부",
      ],
    };
  }, [mode]);

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI VENDOR PRODUCT
            </div>
            <h1 className="mt-1 text-3xl font-black">관별 제품 등록</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              제품을 어느 관에 노출할지 먼저 선택하면, 관 성격에 맞는 등록 항목이 자동으로 바뀝니다.
            </p>
          </div>

          <Link
            href="/vendor/dashboard"
            className="rounded-2xl border bg-white px-5 py-3 text-sm font-black"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">전시관 선택</h2>

          <div className="mt-4 space-y-2">
            {HALL_OPTIONS.map((hall) => (
              <button
                key={hall.id}
                type="button"
                onClick={() => setHallId(hall.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  hallId === hall.id
                    ? "border-green-600 bg-green-50"
                    : "bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="text-base font-black">{hall.label}</div>
                <div className="mt-1 text-sm font-bold leading-6 text-neutral-600">
                  {hall.description}
                </div>
                <div className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                  {modeLabel(hall.mode)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-xs font-black text-green-700">
              {selectedHall.label}
            </div>
            <h2 className="mt-1 text-2xl font-black">{guide.title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
              {guide.desc}
            </p>
          </div>

          <div className="mb-5 rounded-3xl border bg-neutral-50 p-4">
            <div className="mb-3 text-sm font-black text-neutral-700">
              이 관에서 필요한 등록 항목
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {guide.fields.map((field, index) => (
                <div
                  key={field}
                  className="flex items-center gap-2 rounded-2xl bg-white p-3"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black">{field}</span>
                </div>
              ))}
            </div>
          </div>

          <ProductForm mode={mode} hallId={hallId} />
        </div>
      </section>
    </main>
  );
}

function ProductForm({
  mode,
  hallId,
}: {
  mode: ProductMode;
  hallId: ExpoHallId;
}) {
  return (
    <form className="space-y-4">
      <input type="hidden" name="hall_id" value={hallId} />
      <input type="hidden" name="product_mode" value={mode} />

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="제품명 / 서비스명" placeholder="예: 켈팍, 싹쓰리충, 드론 방제기" />
        <Field label="브랜드명" placeholder="예: 도프, 한국농자재, KFFR" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FileField label="제품 사진" />
        <FileField label="팜플렛 / 제품소개서 PDF" />
      </div>

      {mode === "dose_calculator" ? <DoseFields /> : null}
      {mode === "solution" ? <SolutionFields /> : null}
      {mode === "quote" ? <MachineryFields /> : null}
      {mode === "reservation" ? <SeedFields /> : null}
      {mode === "consulting" ? <SmartFields /> : null}
      {mode === "b2b_story" ? <FutureFoodFields /> : null}

      <label className="block">
        <div className="mb-2 text-sm font-black">제품 설명</div>
        <textarea
          rows={5}
          className="w-full rounded-2xl border px-4 py-3 text-sm font-bold"
          placeholder="농민에게 보여줄 핵심 설명을 입력하세요. PDF 업로드 후 AI 자동 추출 기능과 연결 예정입니다."
        />
      </label>

      <div className="rounded-3xl border bg-green-50 p-4">
        <div className="text-sm font-black text-green-800">
          다음 단계 예정
        </div>
        <div className="mt-1 text-sm font-bold leading-6 text-green-800">
          저장 버튼을 API와 연결하면, 제품 사진은 자동 크기 보정되고 PDF는 AI OCR로 제품명·사용량·등록번호·작물 정보를 자동 추출합니다.
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <button
          type="button"
          className="rounded-2xl border bg-white px-5 py-3 text-sm font-black"
        >
          임시저장
        </button>
        <button
          type="button"
          className="rounded-2xl bg-green-700 px-5 py-3 text-sm font-black text-white"
        >
          AI 분석 후 저장
        </button>
      </div>
    </form>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black">{label}</div>
      <input
        className="h-12 w-full rounded-2xl border px-4 text-sm font-bold"
        placeholder={placeholder}
      />
    </label>
  );
}

function FileField({ label }: { label: string }) {
  return (
    <label className="block rounded-2xl border bg-neutral-50 p-4">
      <div className="mb-2 text-sm font-black">{label}</div>
      <input type="file" className="w-full text-sm font-bold" />
      <div className="mt-2 text-xs font-bold text-neutral-500">
        이미지 크기와 관계없이 브랜드관에서는 자동으로 같은 크기로 표시됩니다.
      </div>
    </label>
  );
}

function DoseFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="희석배수" placeholder="예: 500배" />
      <Field label="20L 기준 사용량" placeholder="예: 40ml" />
      <Field label="1,000평 기준 물량" placeholder="예: 400L" />
      <Field label="포장 용량" placeholder="예: 500ml / 1L / 10kg" />
      <Field label="사용 작물" placeholder="예: 고추, 마늘, 양파" />
      <Field label="사용 시기" placeholder="예: 정식 후, 비대기" />
    </div>
  );
}

function SolutionFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="유기농자재 등록번호" placeholder="예: 공시번호" />
      <Field label="대상 병해충" placeholder="예: 총채, 응애, 진딧물" />
      <Field label="사용 작물" placeholder="예: 고추, 오이, 딸기" />
      <Field label="희석배수" placeholder="예: 500배" />
      <Field label="20L 기준 사용량" placeholder="예: 40ml" />
      <Field label="사용 시기" placeholder="예: 발생 초기" />
    </div>
  );
}

function MachineryFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="모델명" placeholder="예: KM-3000" />
      <Field label="마력 / 규격" placeholder="예: 45마력" />
      <Field label="작업폭" placeholder="예: 120cm" />
      <Field label="권장 면적" placeholder="예: 1,000평 이상" />
      <Field label="보조사업 가능 여부" placeholder="예: 가능 / 확인 필요" />
      <Field label="AS 가능 지역" placeholder="예: 전국 / 경북 / 충남" />
    </div>
  );
}

function SeedFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="품종명" placeholder="예: 홍산마늘" />
      <Field label="파종시기" placeholder="예: 9월~10월" />
      <Field label="정식시기" placeholder="예: 10월" />
      <Field label="수확시기" placeholder="예: 6월" />
      <Field label="발아율" placeholder="예: 90%" />
      <Field label="예약 가능 수량" placeholder="예: 1,000주" />
    </div>
  );
}

function SmartFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="서비스명" placeholder="예: AI 병해진단 카메라" />
      <Field label="설치비" placeholder="예: 500,000원" />
      <Field label="월 사용료" placeholder="예: 30,000원" />
      <Field label="지원 작물" placeholder="예: 딸기, 토마토" />
      <Field label="설치 기간" placeholder="예: 7일" />
      <Field label="무료 데모 가능 여부" placeholder="예: 가능" />
    </div>
  );
}

function FutureFoodFields() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="원료명" placeholder="예: 고소애" />
      <Field label="제품 유형" placeholder="예: 단백질 분말, 환, 음료" />
      <Field label="기능성 자료" placeholder="예: 논문/특허 있음" />
      <Field label="인증/특허" placeholder="예: HACCP, 특허" />
      <Field label="B2B 납품 가능 여부" placeholder="예: 가능" />
      <Field label="OEM 가능 여부" placeholder="예: 가능" />
    </div>
  );
}