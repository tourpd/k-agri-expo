"use client";

import { useMemo, useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  status: "draft" | "active" | "hidden";
  price: number;
  stockLabel: string;
};

type LeadRow = {
  id: string;
  farmerName: string;
  phone: string;
  region: string;
  crop: string;
  inquiry: string;
  status: "new" | "contacted" | "done";
  createdAt: string;
};

const PRODUCTS: ProductRow[] = [
  {
    id: "P-001",
    name: "대표 제품 등록 대기",
    category: "비료·영양제",
    status: "draft",
    price: 0,
    stockLabel: "미등록",
  },
];

const LEADS: LeadRow[] = [
  {
    id: "L-001",
    farmerName: "샘플 농가",
    phone: "010-0000-0000",
    region: "경북",
    crop: "고추",
    inquiry: "샘플 신청 문의",
    status: "new",
    createdAt: "오늘",
  },
];

function formatAmount(v: number) {
  if (!v) return "-";
  return `${v.toLocaleString()}원`;
}

function statusLabel(v: string) {
  switch (v) {
    case "active":
      return "노출중";
    case "draft":
      return "작성중";
    case "hidden":
      return "숨김";
    case "new":
      return "신규";
    case "contacted":
      return "상담중";
    case "done":
      return "완료";
    default:
      return v || "-";
  }
}

function statusClass(v: string) {
  if (v === "active" || v === "done") return "bg-green-100 text-green-800";
  if (v === "draft" || v === "new") return "bg-amber-100 text-amber-800";
  if (v === "contacted") return "bg-blue-100 text-blue-800";
  return "bg-neutral-100 text-neutral-700";
}

export default function VendorBrandHallPage() {
  const [brandName, setBrandName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "leads">("products");
  const [notice, setNotice] = useState("");

  const completion = useMemo(() => {
    const checks = [
      brandName,
      shortDescription,
      logoUrl,
      bannerUrl,
      youtubeUrl || homepageUrl,
    ].filter((x) => String(x || "").trim()).length;

    return Math.round((checks / 5) * 100);
  }, [brandName, shortDescription, logoUrl, bannerUrl, youtubeUrl, homepageUrl]);

  function saveDraft() {
    setNotice("브랜드관 정보가 임시 저장되었습니다. 실제 저장 API 연결은 다음 단계에서 붙입니다.");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI VENDOR CENTER
            </div>
            <h1 className="mt-1 text-3xl font-black">내 브랜드관 운영센터</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              입점 업체가 월 사용료를 내는 이유가 보이도록 방문자, 상담, 제품,
              이벤트, 고객관리를 한곳에서 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Stat title="완성도" value={`${completion}%`} tone="green" />
            <Stat title="방문자" value="0명" />
            <Stat title="상담신청" value="0건" tone="blue" />
            <Stat title="샘플신청" value="0건" tone="amber" />
            <Stat title="예상매출" value="-" tone="red" />
          </div>
        </div>
      </section>

      {notice ? (
        <section className="mb-3 rounded-2xl border border-green-200 bg-green-50 p-4 font-black text-green-700">
          {notice}
        </section>
      ) : null}

      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">AI 운영 리포트</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <AiCard
            title="현재 상태"
            text={
              completion < 60
                ? "브랜드관 기본 정보가 부족합니다. 로고, 배너, 회사소개부터 채워야 합니다."
                : "브랜드관 기본 구성이 어느 정도 준비되었습니다."
            }
          />
          <AiCard
            title="이번 주 추천"
            text="제품 3개 이상 등록 후 샘플증정 또는 공동구매 이벤트를 여는 것이 좋습니다."
          />
          <AiCard
            title="업체가 해야 할 일"
            text="로고 → 배너 → 회사소개 → 제품등록 → 이벤트등록 → 공개요청 순서로 진행하세요."
          />
        </div>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">브랜드관 기본정보</h2>
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-2xl bg-green-700 px-5 py-3 font-black text-white"
            >
              임시저장
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="브랜드명">
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="예: 도프 오성분"
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>

            <Field label="유튜브 주소">
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>

            <Field label="로고 이미지 URL">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="로고 이미지 주소"
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>

            <Field label="홈페이지 주소">
              <input
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                placeholder="https://..."
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>

            <Field label="대표 배너 이미지 URL">
              <input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="배너 이미지 주소"
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>

            <Field label="브랜드 한 줄 소개">
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="예: 고추·마늘 농가를 위한 전문 영양 솔루션"
                className="h-12 w-full rounded-2xl border px-4 font-bold"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">공개 준비 단계</h2>

          <div className="mt-4 space-y-2">
            <Step done={!!brandName} n="1" text="브랜드명 입력" />
            <Step done={!!logoUrl} n="2" text="로고 등록" />
            <Step done={!!bannerUrl} n="3" text="배너 등록" />
            <Step done={!!shortDescription} n="4" text="회사소개 작성" />
            <Step done={false} n="5" text="제품 3개 이상 등록" />
            <Step done={false} n="6" text="이벤트 등록" />
            <Step done={false} n="7" text="공개 요청" />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-2xl border bg-white px-5 py-3 font-black"
          >
            내 브랜드관 미리보기
          </button>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <TabButton
              label="제품관리"
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
            />
            <TabButton
              label="고객문의 CRM"
              active={activeTab === "leads"}
              onClick={() => setActiveTab("leads")}
            />
          </div>

          <div className="flex gap-2">
            <button className="rounded-2xl bg-green-700 px-5 py-3 text-sm font-black text-white">
              제품 추가
            </button>
            <button className="rounded-2xl border bg-white px-5 py-3 text-sm font-black">
              이벤트 추가
            </button>
          </div>
        </div>

        {activeTab === "products" ? <ProductTable items={PRODUCTS} /> : null}
        {activeTab === "leads" ? <LeadTable items={LEADS} /> : null}
      </section>
    </main>
  );
}

function ProductTable({ items }: { items: ProductRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <Th>상태</Th>
            <Th>제품명</Th>
            <Th>카테고리</Th>
            <Th>가격</Th>
            <Th>재고/공급</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <Td>
                <Badge value={item.status} />
              </Td>
              <Td strong>{item.name}</Td>
              <Td>{item.category}</Td>
              <Td strong>{formatAmount(item.price)}</Td>
              <Td>{item.stockLabel}</Td>
              <Td>
                <div className="flex gap-1">
                  <SmallButton label="수정" />
                  <SmallButton label="숨김" />
                  <SmallButton label="삭제" danger />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadTable({ items }: { items: LeadRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[1300px] border-collapse text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <Th>상태</Th>
            <Th>농가명</Th>
            <Th>전화</Th>
            <Th>지역</Th>
            <Th>작물</Th>
            <Th>문의내용</Th>
            <Th>문의일</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <Td>
                <Badge value={item.status} />
              </Td>
              <Td strong>{item.farmerName}</Td>
              <Td strong>{item.phone}</Td>
              <Td>{item.region}</Td>
              <Td>{item.crop}</Td>
              <Td>{item.inquiry}</Td>
              <Td>{item.createdAt}</Td>
              <Td>
                <div className="flex gap-1">
                  <SmallButton label="전화완료" />
                  <SmallButton label="메모" />
                  <SmallButton label="완료" />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "red" | "amber" | "green" | "blue";
}) {
  const cls =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-neutral-200 bg-white text-neutral-900";

  return (
    <div className={`rounded-2xl border p-3 text-center ${cls}`}>
      <div className="text-xs font-black">{title}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function AiCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <div className="text-sm font-black text-green-700">{title}</div>
      <div className="mt-2 text-sm font-bold leading-6 text-neutral-700">{text}</div>
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
    <label>
      <div className="mb-2 text-sm font-black text-neutral-700">{label}</div>
      {children}
    </label>
  );
}

function Step({ n, text, done }: { n: string; text: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl p-3 ${done ? "bg-green-50" : "bg-neutral-50"}`}>
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${
          done ? "bg-green-700" : "bg-neutral-400"
        }`}
      >
        {n}
      </span>
      <span className={`font-black ${done ? "text-green-800" : "text-neutral-700"}`}>
        {text}
      </span>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black ${
        active ? "bg-green-700 text-white" : "border bg-white text-neutral-900"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b px-3 py-3 text-left text-xs font-black text-neutral-700">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b px-3 py-3 align-middle ${
        strong ? "font-black text-neutral-950" : "font-bold text-neutral-700"
      }`}
    >
      {children}
    </td>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-full px-2 py-1 text-xs font-black ${statusClass(
        value
      )}`}
    >
      {statusLabel(value)}
    </span>
  );
}

function SmallButton({ label, danger = false }: { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-xl px-3 py-2 text-xs font-black ${
        danger ? "bg-red-600 text-white" : "border bg-white text-neutral-900"
      }`}
    >
      {label}
    </button>
  );
}