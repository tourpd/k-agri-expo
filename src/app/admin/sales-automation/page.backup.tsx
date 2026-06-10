"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type WorkStatus = "ready" | "analyzing" | "done" | "error";

type SalesAutomationItem = {
  id: string;
  status: WorkStatus;
  productName: string;
  companyName: string;
  industry: string;
  aiAnalysis: string;
  adCount: number;
  shortsCount: number;
  videoCount: number;
  bannerCount: number;
  crmStatus: string;
  groupBuyStatus: string;
  repurchaseStatus: string;
  updatedAt: string;
};

const sampleItems: SalesAutomationItem[] = [
  {
    id: "1",
    status: "done",
    productName: "싹쓰리충",
    companyName: "도프",
    industry: "농자재",
    aiAnalysis: "완료",
    adCount: 5,
    shortsCount: 3,
    videoCount: 2,
    bannerCount: 5,
    crmStatus: "등록",
    groupBuyStatus: "추천",
    repurchaseStatus: "30일 후",
    updatedAt: "2026-06-07",
  },
  {
    id: "2",
    status: "analyzing",
    productName: "홍산마늘",
    companyName: "홍산마늘연구회",
    industry: "농산물",
    aiAnalysis: "분석중",
    adCount: 0,
    shortsCount: 0,
    videoCount: 0,
    bannerCount: 0,
    crmStatus: "대기",
    groupBuyStatus: "대기",
    repurchaseStatus: "대기",
    updatedAt: "2026-06-07",
  },
  {
    id: "3",
    status: "ready",
    productName: "MSM 관절 부스터",
    companyName: "한미양행",
    industry: "건강기능식품",
    aiAnalysis: "대기",
    adCount: 0,
    shortsCount: 0,
    videoCount: 0,
    bannerCount: 0,
    crmStatus: "대기",
    groupBuyStatus: "대기",
    repurchaseStatus: "대기",
    updatedAt: "2026-06-07",
  },
];

const statusLabel: Record<WorkStatus, string> = {
  ready: "대기",
  analyzing: "분석중",
  done: "완료",
  error: "오류",
};

const statusClass: Record<WorkStatus, string> = {
  ready: "bg-stone-100 text-stone-800",
  analyzing: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function SalesAutomationPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | WorkStatus>("all");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    return sampleItems.filter((item) => {
      const q = query.trim().toLowerCase();

      const matchedQuery =
        !q ||
        item.productName.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q);

      const matchedStatus = status === "all" || item.status === status;

      return matchedQuery && matchedStatus;
    });
  }, [query, status]);

  const allChecked =
    filteredItems.length > 0 &&
    filteredItems.every((item) => checkedIds.includes(item.id));

  function toggleAll() {
    if (allChecked) {
      setCheckedIds((prev) =>
        prev.filter((id) => !filteredItems.some((item) => item.id === id))
      );
      return;
    }

    setCheckedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-[1800px]">
        <section className="rounded-3xl bg-gradient-to-r from-green-900 via-green-700 to-green-500 p-8 text-white shadow-2xl">
          <p className="text-lg font-black text-green-100">K-Agri Expo</p>

          <div className="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-black leading-tight">
                AI 판매자동화센터
              </h1>

              <p className="mt-5 text-2xl font-bold leading-relaxed">
                제품별 AI 분석 · 광고 · 쇼츠 · 영상 · 배너 · 문자 · 공동구매 · CRM 작업상태를 한눈에 관리합니다.
              </p>
            </div>

            <Link
              href="/admin/sales-automation/new"
              className="rounded-2xl bg-white px-7 py-5 text-center text-2xl font-black text-green-800 shadow-xl"
            >
              + 새 제품 등록
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard title="전체 작업" value={`${sampleItems.length}건`} />
          <SummaryCard
            title="AI 완료"
            value={`${sampleItems.filter((v) => v.status === "done").length}건`}
          />
          <SummaryCard
            title="분석중"
            value={`${sampleItems.filter((v) => v.status === "analyzing").length}건`}
          />
          <SummaryCard
            title="선택됨"
            value={`${checkedIds.length}건`}
          />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-3">
              <FilterButton label="전체" active={status === "all"} onClick={() => setStatus("all")} />
              <FilterButton label="대기" active={status === "ready"} onClick={() => setStatus("ready")} />
              <FilterButton label="분석중" active={status === "analyzing"} onClick={() => setStatus("analyzing")} />
              <FilterButton label="완료" active={status === "done"} onClick={() => setStatus("done")} />
              <FilterButton label="오류" active={status === "error"} onClick={() => setStatus("error")} />
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제품명, 업체명, 산업군 검색"
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-4 text-xl font-black outline-none placeholder:text-stone-400 focus:border-green-700 xl:w-[420px]"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton label="선택 AI 분석" />
            <ActionButton label="광고 생성" />
            <ActionButton label="쇼츠 생성" />
            <ActionButton label="문자 발송 준비" />
            <ActionButton label="공동구매 생성" />
            <ActionButton label="CRM 태그 저장" />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
            <table className="min-w-[1500px] w-full border-collapse text-left">
              <thead className="sticky top-0 bg-stone-100 text-lg font-black text-stone-900">
                <tr>
                  <Th>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-5 w-5"
                    />
                  </Th>
                  <Th>상태</Th>
                  <Th>제품명</Th>
                  <Th>업체명</Th>
                  <Th>산업군</Th>
                  <Th>AI분석</Th>
                  <Th>광고</Th>
                  <Th>쇼츠</Th>
                  <Th>영상</Th>
                  <Th>배너</Th>
                  <Th>CRM</Th>
                  <Th>공동구매</Th>
                  <Th>재구매</Th>
                  <Th>최종수정</Th>
                  <Th>액션</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-200 text-lg font-bold">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-green-50">
                    <Td>
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="h-5 w-5"
                      />
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-base font-black ${statusClass[item.status]}`}
                      >
                        {statusLabel[item.status]}
                      </span>
                    </Td>
                    <Td>{item.productName}</Td>
                    <Td>{item.companyName}</Td>
                    <Td>{item.industry}</Td>
                    <Td>{item.aiAnalysis}</Td>
                    <Td>{item.adCount}개</Td>
                    <Td>{item.shortsCount}개</Td>
                    <Td>{item.videoCount}개</Td>
                    <Td>{item.bannerCount}개</Td>
                    <Td>{item.crmStatus}</Td>
                    <Td>{item.groupBuyStatus}</Td>
                    <Td>{item.repurchaseStatus}</Td>
                    <Td>{item.updatedAt}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/sales-automation/${item.id}`}
                          className="rounded-xl bg-stone-900 px-4 py-3 text-base font-black text-white"
                        >
                          상세
                        </Link>
                        <Link
                          href={`/admin/sales-automation/${item.id}/edit`}
                          className="rounded-xl bg-green-700 px-4 py-3 text-base font-black text-white"
                        >
                          수정
                        </Link>
                      </div>
                    </Td>
                  </tr>
                ))}

                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="p-10 text-center text-2xl font-black text-stone-500"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5">
      <p className="text-lg font-black text-stone-500">{title}</p>
      <p className="mt-2 text-4xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function FilterButton({
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
      onClick={onClick}
      className={`rounded-2xl px-6 py-4 text-xl font-black ${
        active
          ? "bg-green-700 text-white"
          : "bg-stone-100 text-stone-800 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-white">
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-4">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-4 align-middle">{children}</td>;
}