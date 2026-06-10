"use client";

import Link from "next/link";
import AiConsultingProgress from "@/components/sales-automation/AiConsultingProgress";
import { useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type StepKey =
  | "company"
  | "product"
  | "people"
  | "content"
  | "meeting"
  | "opportunity"
  | "growth"
  | "execution"
  | "erp";

type Status = "대기" | "진행중" | "완료";

const consultingSteps: { key: StepKey; no: string; title: string; desc: string }[] = [
  { key: "company", no: "1", title: "기업진단", desc: "회사·홈페이지·공개자료" },
  { key: "product", no: "2", title: "제품진단", desc: "주력·성장·계절상품" },
  { key: "people", no: "3", title: "사람진단", desc: "대표·전문가·출연자" },
  { key: "content", no: "4", title: "콘텐츠진단", desc: "유튜브·쇼츠·상세" },
  { key: "meeting", no: "5", title: "AI 회의", desc: "전략·비평·농민심리" },
  { key: "opportunity", no: "6", title: "놓친기회", desc: "재가공·전환·확장" },
  { key: "growth", no: "7", title: "성장전략", desc: "1개월·3개월·1년" },
  { key: "execution", no: "8", title: "실행전략", desc: "광고·쇼츠·공동구매" },
  { key: "erp", no: "9", title: "ERP/CRM", desc: "매출·고객·재구매" },
];

const sampleItems = [
  {
    id: "1",
    company: "진단 대기 업체 A",
    input: "홈페이지 · 유튜브",
    status: "완료" as Status,
    companyDiagnosis: "공개자료 확인 완료",
    productDiagnosis: "제품군 분석 필요",
    peopleDiagnosis: "대표/전문가 자산 확인 필요",
    contentDiagnosis: "유튜브 자산 있음",
    meeting: "1차 회의 필요",
    opportunity: "영상 재가공 가능성",
    growth: "3개월 전략 필요",
    erp: "미연결",
    score: "B+",
  },
  {
    id: "2",
    company: "진단 대기 업체 B",
    input: "카탈로그 · 제품사진",
    status: "진행중" as Status,
    companyDiagnosis: "회사자료 부족",
    productDiagnosis: "제품명/효능 추출중",
    peopleDiagnosis: "인물자산 없음",
    contentDiagnosis: "온라인 콘텐츠 부족",
    meeting: "대기",
    opportunity: "상세페이지 구축 우선",
    growth: "1개월 전략 필요",
    erp: "미연결",
    score: "-",
  },
  {
    id: "3",
    company: "진단 대기 업체 C",
    input: "회사소개서 · 매출자료",
    status: "대기" as Status,
    companyDiagnosis: "자료 업로드됨",
    productDiagnosis: "대기",
    peopleDiagnosis: "대기",
    contentDiagnosis: "대기",
    meeting: "대기",
    opportunity: "대기",
    growth: "대기",
    erp: "엑셀 업로드",
    score: "-",
  },
];

const statusClass: Record<Status, string> = {
  대기: "bg-stone-100 text-stone-800",
  진행중: "bg-blue-100 text-blue-800",
  완료: "bg-green-100 text-green-800",
};

export default function SalesAutomationPage() {
  const [activeStep, setActiveStep] = useState<StepKey>("company");
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("대기");
  const [query, setQuery] = useState("");

  const active = consultingSteps.find((v) => v.key === activeStep) ?? consultingSteps[0];

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sampleItems;
    return sampleItems.filter((item) =>
      [item.company, item.input, item.companyDiagnosis, item.productDiagnosis, item.contentDiagnosis]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-[1900px]">
        <section className="rounded-3xl bg-gradient-to-r from-green-950 via-green-800 to-green-600 p-8 text-white shadow-2xl">
          <p className="text-lg font-black text-green-100">K-Agri Expo</p>

          <div className="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-black leading-tight">
                🚜 K-Agri Expo AI 컨설팅
              </h1>

              <p className="mt-5 text-2xl font-bold leading-relaxed">
                홈페이지·유튜브·스마트스토어·블로그·회사소개서·카탈로그·제품이미지·매출자료 중 하나만 있어도
                AI가 기업, 제품, 사람, 콘텐츠, 매출 구조를 단계적으로 진단합니다.
              </p>

              <p className="mt-5 rounded-2xl bg-white/15 p-4 text-2xl font-black">
                회사 → 사람 → 콘텐츠 → 제품 → 광고 → 매출 → 브랜드
              </p>
            </div>

            <button
              onClick={() => {
                setStarted(true);
                setProgress(5);
                setPhase("자료 확인중");

                setTimeout(() => { setProgress(20); setPhase("홈페이지·유튜브 분석중"); }, 1500);
                setTimeout(() => { setProgress(35); setPhase("DART·공개자료 확인중"); }, 3500);
                setTimeout(() => { setProgress(50); setPhase("사업영역·제품군 분석중"); }, 5500);
                setTimeout(() => { setProgress(65); setPhase("콘텐츠 자산 분석중"); }, 7500);
                setTimeout(() => { setProgress(80); setPhase("마케팅 비용 구조 분석중"); }, 9500);
                setTimeout(() => { setProgress(95); setPhase("AI 전략회의 진행중"); }, 11500);
                setTimeout(() => { setProgress(100); setPhase("1차 보고서 생성 완료"); }, 13500);
              }}
              className="rounded-2xl bg-white px-7 py-5 text-center text-2xl font-black text-green-900 shadow-xl"
            >
              🧠 AI 컨설팅 시작
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <h2 className="text-4xl font-black">🧭 AI 컨설팅 9단계</h2>
          <p className="mt-2 text-xl font-bold text-stone-600">
            광고는 마지막 결과물입니다. 먼저 회사를 진단하고, 사람과 콘텐츠와 제품을 분석한 뒤 실행전략으로 넘어갑니다.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-9">
            {consultingSteps.map((step) => {
              const selected = activeStep === step.key;
              return (
                <button
                  key={step.key}
                  onClick={() => setActiveStep(step.key)}
                  className={`rounded-2xl border-4 p-4 text-left transition ${
                    selected
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-stone-200 bg-stone-50 text-black hover:border-green-700"
                  }`}
                >
                  <p className="text-lg font-black">STEP {step.no}</p>
                  <p className="mt-2 text-2xl font-black">{step.title}</p>
                  <p className={`mt-2 text-sm font-bold ${selected ? "text-green-50" : "text-stone-600"}`}>
                    {step.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xl font-black text-green-700">현재 단계</p>
              <h2 className="mt-2 text-5xl font-black">
                STEP {active.no}. {active.title}
              </h2>
              <p className="mt-3 text-2xl font-bold text-stone-700">{active.desc}</p>
            </div>

            <Link
              href="/admin/sales-automation/new"
              className="rounded-2xl bg-black px-7 py-5 text-center text-2xl font-black text-white"
            >
              + 새 컨설팅 등록
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="홈페이지 URL" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="유튜브 채널 URL" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="스마트스토어 URL" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="블로그 / 카페 URL" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <UploadBox title="회사소개서" accept=".pdf,.ppt,.pptx,.doc,.docx" />
            <UploadBox title="제품 카탈로그" accept=".pdf,.ppt,.pptx,.doc,.docx" />
            <UploadBox title="제품 이미지" accept="image/*" />
            <UploadBox title="기존 영상" accept="video/*" />
            <UploadBox title="ERP/매출자료" accept=".xls,.xlsx,.csv" />
          </div>

          <div className="mt-6 rounded-3xl bg-green-50 p-5">
            <p className="text-2xl font-black">컨설팅 받고 싶은 고민</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "무엇을 밀어야 할지 모르겠음",
                "유튜브가 왜 안 크는지 알고 싶음",
                "어떤 제품이 돈 되는지 알고 싶음",
                "대표/전문가를 브랜드화하고 싶음",
                "광고 방향을 모르겠음",
                "ERP 기반 진단을 받고 싶음",
              ].map((item) => (
                <label key={item} className="flex items-center gap-3 text-xl font-bold">
                  <input type="checkbox" className="h-6 w-6" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
                setStarted(true);
                setProgress(5);
                setPhase("자료 확인중");

                setTimeout(() => { setProgress(20); setPhase("홈페이지·유튜브 분석중"); }, 1500);
                setTimeout(() => { setProgress(35); setPhase("DART·공개자료 확인중"); }, 3500);
                setTimeout(() => { setProgress(50); setPhase("사업영역·제품군 분석중"); }, 5500);
                setTimeout(() => { setProgress(65); setPhase("콘텐츠 자산 분석중"); }, 7500);
                setTimeout(() => { setProgress(80); setPhase("마케팅 비용 구조 분석중"); }, 9500);
                setTimeout(() => { setProgress(95); setPhase("AI 전략회의 진행중"); }, 11500);
                setTimeout(() => { setProgress(100); setPhase("1차 보고서 생성 완료"); }, 13500);
              }}
            className="mt-6 w-full rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white"
          >
            🧠 AI 컨설팅 시작
          </button>
        </section>

        {started && (
          <AiConsultingProgress
            progress={progress}
            phase={phase}
            done={progress >= 100}
          />
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard title="성장 가능성" value="진단중" />
          <SummaryCard title="콘텐츠 자산가치" value="진단중" />
          <SummaryCard title="공동구매 가능성" value="진단중" />
          <SummaryCard title="ERP 연결상태" value="미연결" />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-4xl font-black">AI 컨설팅 작업 현황</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="회사명, 자료, 진단내용 검색"
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-4 text-xl font-black outline-none placeholder:text-stone-400 focus:border-green-700 xl:w-[420px]"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton label="선택 기업진단" />
            <ActionButton label="제품진단" />
            <ActionButton label="사람진단" />
            <ActionButton label="콘텐츠진단" />
            <ActionButton label="성장전략" />
            <ActionButton label="실행전략" />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1800px] border-collapse text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-4 text-lg">선택</th>
                  <th className="p-4 text-lg">회사</th>
                  <th className="p-4 text-lg">입력자료</th>
                  <th className="p-4 text-lg">상태</th>
                  <th className="p-4 text-lg">기업진단</th>
                  <th className="p-4 text-lg">제품진단</th>
                  <th className="p-4 text-lg">사람진단</th>
                  <th className="p-4 text-lg">콘텐츠진단</th>
                  <th className="p-4 text-lg">AI 회의</th>
                  <th className="p-4 text-lg">놓친기회</th>
                  <th className="p-4 text-lg">성장전략</th>
                  <th className="p-4 text-lg">ERP</th>
                  <th className="p-4 text-lg">점수</th>
                  <th className="p-4 text-lg">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b-2 border-stone-200 hover:bg-green-50">
                    <td className="p-4"><input type="checkbox" className="h-6 w-6" /></td>
                    <td className="p-4 text-xl font-black">{item.company}</td>
                    <td className="p-4 text-lg font-bold">{item.input}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-4 py-2 text-lg font-black ${statusClass[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-lg font-bold">{item.companyDiagnosis}</td>
                    <td className="p-4 text-lg font-bold">{item.productDiagnosis}</td>
                    <td className="p-4 text-lg font-bold">{item.peopleDiagnosis}</td>
                    <td className="p-4 text-lg font-bold">{item.contentDiagnosis}</td>
                    <td className="p-4 text-lg font-bold">{item.meeting}</td>
                    <td className="p-4 text-lg font-bold text-red-700">{item.opportunity}</td>
                    <td className="p-4 text-lg font-bold text-green-700">{item.growth}</td>
                    <td className="p-4 text-lg font-bold">{item.erp}</td>
                    <td className="p-4 text-xl font-black">{item.score}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/sales-automation/${item.id}`}
                          className="rounded-xl bg-black px-4 py-3 font-black text-white"
                        >
                          보기
                        </Link>
                        <button className="rounded-xl bg-green-700 px-4 py-3 font-black text-white">
                          다음
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function UploadBox({ title, accept }: { title: string; accept: string }) {
  return (
    <label className="rounded-3xl border-4 border-dashed border-black bg-stone-50 p-5">
      <p className="text-2xl font-black">📎 {title}</p>
      <input type="file" accept={accept} className="mt-4 block w-full text-lg font-bold" />
    </label>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
      <p className="text-lg font-black text-stone-500">{title}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-white">
      {label}
    </button>
  );
}

function Result({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-green-50 p-5">
      <p className="text-xl font-black text-stone-700">{title}</p>
      <p className="mt-2 text-4xl font-black text-green-700">{value}</p>
      <p className="mt-3 text-lg font-bold">{desc}</p>
    </div>
  );
}

function Box({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6">
      <h3 className="text-3xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <p key={line} className="text-xl font-bold leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
