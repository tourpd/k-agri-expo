"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Rule = {
  id: string;
  source_visual_page_id?: string | null;
  source_title?: string | null;
  page_number?: number | null;
  crop_name?: string | null;
  disease_name?: string | null;
  growth_stage?: string | null;
  rule_title?: string | null;
  trigger_condition?: string | null;
  action_instruction?: string | null;
  confidence?: number | null;
  status?: string | null;
  created_at?: string | null;
};

function statusLabel(v?: string | null) {
  if (v === "auto_approved") return "자동승인";
  if (v === "review_needed") return "검수필요";
  if (v === "approved") return "확정";
  if (v === "rejected") return "보류";
  return v || "후보";
}

export default function DecisionRulesPage() {
  const [rows, setRows] = useState<Rule[]>([]);
  const [active, setActive] = useState<Rule | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/decision-rules", { cache: "no-store" });
    const json = await res.json();
    setRows(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      review: rows.filter((r) => r.status === "review_needed").length,
      auto: rows.filter((r) => r.status === "auto_approved").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;

    if (filter !== "전체") {
      list = list.filter((r) => {
        if (filter === "검수필요") return r.status === "review_needed";
        if (filter === "자동승인") return r.status === "auto_approved";
        if (filter === "확정") return r.status === "approved";
        if (filter === "보류") return r.status === "rejected";
        return true;
      });
    }

    const k = q.trim().toLowerCase();
    if (!k) return list;

    return list.filter((r) =>
      [
        r.crop_name,
        r.disease_name,
        r.growth_stage,
        r.rule_title,
        r.trigger_condition,
        r.action_instruction,
        r.source_title,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [rows, q, filter]);

  function updateActive(key: keyof Rule, value: string) {
    setActive((prev) => {
      if (!prev) return prev;
      if (key === "confidence") return { ...prev, confidence: Number(value || 0) };
      return { ...prev, [key]: value };
    });
  }

  async function saveActive(status?: string) {
    if (!active) return;

    setSaving(true);

    const body = status ? { ...active, status } : active;

    const res = await fetch("/api/admin/decision-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      alert("저장 실패");
      setSaving(false);
      return;
    }

    await load();
    setActive(null);
    setSaving(false);
    alert("저장 완료");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <section className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI BRAIN / 판단규칙센터
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              판단규칙센터
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              자료화면 AI DB에서 생성된 정보를 고객 행동지시로 바꾸는 K-AGRI 두뇌의 핵심 규칙센터입니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/visual-knowledge" className="rounded-xl bg-white px-4 py-3 text-sm font-black">
              자료화면 AI DB
            </Link>
            <button onClick={load} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-black text-white">
              새로고침
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          <Stat label="전체규칙" value={stats.total} />
          <Stat label="검수필요" value={stats.review} />
          <Stat label="자동승인" value={stats.auto} />
          <Stat label="확정" value={stats.approved} />
          <Stat label="보류" value={stats.rejected} />
        </div>

        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs">
          <b>흐름</b> : 자료화면 → AI 분석 → 판단규칙 후보 → 세환PD 검수 → 확정규칙 → 고객상담·행동지시·작가실 활용
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["전체", "검수필요", "자동승인", "확정", "보류"].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={[
                "rounded-full border px-4 py-2 text-xs font-black",
                filter === v ? "bg-green-700 text-white" : "bg-white",
              ].join(" ")}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="작물, 병해충, 판단조건, 행동지시, 출처 검색"
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-white shadow">
        <div className="max-h-[72vh] overflow-auto">
          <table className="w-full min-w-[1500px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-gray-950 text-white">
              <tr>
                <Th w="120px">작물</Th>
                <Th w="150px">병해충</Th>
                <Th w="120px">생육단계</Th>
                <Th w="260px">판단규칙</Th>
                <Th w="360px">판단조건</Th>
                <Th w="360px">고객 행동지시</Th>
                <Th w="90px">신뢰도</Th>
                <Th w="110px">상태</Th>
                <Th w="180px">출처자료</Th>
                <Th w="80px">페이지</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    판단규칙이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setActive(r)}
                    className="cursor-pointer border-b hover:bg-green-50"
                  >
                    <Td strong>{r.crop_name || "공통"}</Td>
                    <Td>{r.disease_name || "없음"}</Td>
                    <Td>{r.growth_stage || "미분류"}</Td>
                    <Td strong>{r.rule_title || "-"}</Td>
                    <Td>{r.trigger_condition || "-"}</Td>
                    <Td>{r.action_instruction || "-"}</Td>
                    <Td center>{r.confidence ?? 70}%</Td>
                    <Td><Badge value={r.status} /></Td>
                    <Td>{r.source_title || "-"}</Td>
                    <Td center>{r.page_number || "-"}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {active && (
        <aside className="fixed left-1/2 top-1/2 z-[9999] flex h-[84vh] w-[780px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b p-4">
            <div>
              <div className="text-xs font-black text-green-700">
                K-AGRI 판단규칙 검수실
              </div>
              <h2 className="text-xl font-black">
                {active.rule_title || "판단규칙 상세"}
              </h2>
              <p className="text-xs text-gray-500">
                출처: {active.source_title || "-"} / 페이지 {active.page_number || "-"}
              </p>
            </div>
            <button onClick={() => setActive(null)} className="rounded-lg border px-3 py-2 text-sm font-black">
              닫기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              <Field label="작물" value={active.crop_name || ""} onChange={(v) => updateActive("crop_name", v)} />
              <Field label="병해충" value={active.disease_name || ""} onChange={(v) => updateActive("disease_name", v)} />
              <Field label="생육단계" value={active.growth_stage || ""} onChange={(v) => updateActive("growth_stage", v)} />
            </div>

            <Field label="판단규칙 제목" value={active.rule_title || ""} onChange={(v) => updateActive("rule_title", v)} />
            <Area label="판단조건" value={active.trigger_condition || ""} onChange={(v) => updateActive("trigger_condition", v)} />
            <Area label="고객 행동지시" value={active.action_instruction || ""} onChange={(v) => updateActive("action_instruction", v)} />

            <div className="grid grid-cols-2 gap-2">
              <Field label="신뢰도" value={String(active.confidence ?? 70)} onChange={(v) => updateActive("confidence", v)} />
              <Field label="상태" value={statusLabel(active.status)} onChange={() => {}} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-t bg-white p-4">
            <button onClick={() => saveActive("approved")} disabled={saving} className="rounded-xl bg-green-700 py-3 text-base font-black text-white">
              확정
            </button>
            <button onClick={() => saveActive("review_needed")} disabled={saving} className="rounded-xl bg-yellow-500 py-3 text-base font-black text-white">
              검수필요
            </button>
            <button onClick={() => saveActive("rejected")} disabled={saving} className="rounded-xl bg-gray-700 py-3 text-base font-black text-white">
              보류
            </button>
            <button onClick={() => saveActive()} disabled={saving} className="rounded-xl bg-black py-3 text-base font-black text-white">
              저장
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] font-black text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-black">{value.toLocaleString()}</div>
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w: string }) {
  return (
    <th style={{ width: w }} className="border-r border-gray-800 px-3 py-3 text-left font-black">
      {children}
    </th>
  );
}

function Td({ children, center, strong }: { children: React.ReactNode; center?: boolean; strong?: boolean }) {
  return (
    <td
      className={[
        "max-w-[380px] overflow-hidden text-ellipsis whitespace-nowrap border-r px-3 py-2 align-middle",
        center ? "text-center" : "",
        strong ? "font-black" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function Badge({ value }: { value?: string | null }) {
  const label = statusLabel(value);
  const cls =
    value === "approved"
      ? "bg-green-100 text-green-800"
      : value === "auto_approved"
      ? "bg-blue-100 text-blue-800"
      : value === "rejected"
      ? "bg-gray-200 text-gray-700"
      : "bg-yellow-100 text-yellow-800";

  return <span className={`rounded-full px-2 py-1 text-[11px] font-black ${cls}`}>{label}</span>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 block">
      <div className="mb-1 text-xs font-black text-gray-600">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 block">
      <div className="mb-1 text-xs font-black text-gray-600">{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-28 w-full rounded-lg border px-3 py-2 text-sm leading-relaxed" />
    </label>
  );
}
