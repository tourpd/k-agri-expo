"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  source_title?: string | null;
  source_name?: string | null;
  page_number?: number | null;
  image_url?: string | null;
  crop_name?: string | null;
  disease_name?: string | null;
  growth_stage?: string | null;
  key_info?: string | null;
  ai_summary?: string | null;
  action_instruction?: string | null;
  broadcast_material?: string | null;
  shorts_material?: string | null;
  pd_memo?: string | null;
  edit_request?: string | null;
  next_action?: string | null;
  db_location?: string | null;
  usage_flow?: string | null;
  raw?: any;
};

const FLOW =
  "업로드 → 이미지DB → GPT Vision 자동분석 → 세환PD 검수 → 판단규칙DB → 방송소재 → 쇼츠 → 농민상담 → 행동지시";

function visualType(r: Row) {
  return r.raw?.ai_visual_type || r.raw?.visual_type || "자료화면";
}

function status(r: Row) {
  if (r.raw?.ai_status === "vision_complete") return "분석완료";
  if (r.crop_name && r.crop_name !== "분석필요") return "검수필요";
  return "분석대기";
}

function reading(r: Row) {
  const crop = r.crop_name && r.crop_name !== "분석필요" ? r.crop_name : "";
  const disease = r.disease_name && r.disease_name !== "없음" ? r.disease_name : "";
  if (crop && disease) return `${crop} / ${disease}`;
  if (crop) return crop;
  return "미분석";
}

function useCase(r: Row) {
  return r.raw?.business_use || "방송·쇼츠·상담·판단규칙";
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState<Row | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ total: 0, done: 0, fail: 0, current: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/visual-knowledge", { cache: "no-store" });
    const json = await res.json();
    setRows(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => status(r) !== "분석대기").length;
    const wait = total - done;
    const rule = rows.filter((r) => String(r.next_action || "").includes("판단규칙")).length;
    return { total, wait, done, rule, selected: selectedIds.length };
  }, [rows, selectedIds]);

  const filtered = useMemo(() => {
    let list = rows;

    if (filter !== "전체") {
      list = list.filter((r) => {
        if (filter === "분석대기") return status(r) === "분석대기";
        if (filter === "분석완료") return status(r) !== "분석대기";
        if (filter === "판단규칙") return String(r.next_action || "").includes("판단규칙");
        if (filter === "방송소재") return !!r.broadcast_material;
        if (filter === "쇼츠소재") return !!r.shorts_material;
        return true;
      });
    }

    const k = q.trim().toLowerCase();
    if (!k) return list;

    return list.filter((r) =>
      [
        r.source_title,
        r.source_name,
        visualType(r),
        status(r),
        reading(r),
        r.key_info,
        r.ai_summary,
        r.next_action,
        useCase(r),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [rows, q, filter]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function openRow(r: Row) {
    setActive({
      ...r,
      db_location: r.db_location || "knowledge_visual_pages",
      usage_flow: r.usage_flow || FLOW,
    });
  }

  function updateActive(key: keyof Row, value: string) {
    setActive((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveActive() {
    if (!active) return;
    setBusy(true);

    const res = await fetch("/api/admin/visual-knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(active),
    });

    if (!res.ok) {
      alert("저장 실패");
      setBusy(false);
      return;
    }

    await load();
    setBusy(false);
    alert("저장 완료");
  }

  async function analyzeOne(id?: string) {
    const targetId = id || active?.id || selectedIds[0];

    if (!targetId) {
      alert("분석할 자료를 선택하세요.");
      return;
    }

    setBusy(true);

    const res = await fetch("/api/admin/visual-knowledge/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: targetId }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "AI 분석 실패");
      setBusy(false);
      return;
    }

    if (active?.id === targetId && json.item) {
      setActive({ ...active, ...json.item });
    }

    await load();
    setBusy(false);
    alert("AI 분석 완료");
  }


  async function materializeBrainDb() {
    const ids = selectedIds.length ? selectedIds : [];

    if (!confirm(ids.length ? `선택한 ${ids.length}건을 두뇌DB로 생성할까요?` : "분석된 전체 자료를 두뇌DB로 생성할까요?")) {
      return;
    }

    setBusy(true);

    const res = await fetch("/api/admin/visual-knowledge/materialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    const json = await res.json();

    setBusy(false);

    if (!res.ok) {
      alert(json.error || "두뇌DB 생성 실패");
      return;
    }

    alert(
      `두뇌DB 생성 완료\n` +
      `원본자료 ${json.source_count}건\n` +
      `판단규칙 ${json.decision_rules}건\n` +
      `방송소재 ${json.broadcast_materials}건\n` +
      `쇼츠소재 ${json.shorts_materials}건\n` +
      `농민상담 ${json.consulting_answers}건\n` +
      `행동지시 ${json.action_instructions}건`
    );

    await load();
  }

  async function analyzeAll() {
    const targets = selectedIds.length
      ? rows.filter((r) => selectedIds.includes(r.id))
      : rows.filter((r) => status(r) === "분석대기");

    if (targets.length === 0) {
      alert("분석할 자료가 없습니다.");
      return;
    }

    if (!confirm(`총 ${targets.length}건을 자동분석합니다. 진행할까요?`)) return;

    setBusy(true);
    setProgress({ total: targets.length, done: 0, fail: 0, current: "" });

    let done = 0;
    let fail = 0;

    for (const row of targets) {
      setProgress({
        total: targets.length,
        done,
        fail,
        current: `${row.source_title || row.source_name || "자료"} / ${row.page_number || "-"}p`,
      });

      try {
        const res = await fetch("/api/admin/visual-knowledge/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id }),
        });

        if (res.ok) done += 1;
        else fail += 1;
      } catch {
        fail += 1;
      }

      setProgress({
        total: targets.length,
        done,
        fail,
        current: `${row.source_title || row.source_name || "자료"} / ${row.page_number || "-"}p`,
      });
    }

    await load();
    setBusy(false);
    alert(`자동분석 완료\n성공 ${done}건 / 실패 ${fail}건`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <section className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI EXPO / 농업 AI 두뇌센터
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              자료화면 AI DB센터
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              업로드된 모든 농업자료를 AI가 자동분석하고, 운영자는 엑셀형 관제표에서 검수·활용만 합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-black text-white">
              DB 새로고침
            </button>
            <button className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
              + 새 자료 업로드
            </button>
            <button
              onClick={analyzeAll}
              disabled={busy}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white"
            >
              {busy ? "자동분석 중..." : "🚀 전체 자동분석"}
            </button>
            <button
              onClick={materializeBrainDb}
              disabled={busy}
              className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white"
            >
              🧠 두뇌DB 생성
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          <Stat label="전체자료" value={stats.total} />
          <Stat label="분석대기" value={stats.wait} />
          <Stat label="분석완료/검수" value={stats.done} />
          <Stat label="판단규칙 후보" value={stats.rule} />
          <Stat label="선택자료" value={stats.selected} />
        </div>

        {busy && (
          <div className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
            <b>AI 전체 자동분석 진행 중</b>
            <div className="mt-1">
              전체 {progress.total}건 / 완료 {progress.done}건 / 실패 {progress.fail}건
            </div>
            <div className="mt-1 text-gray-600">현재: {progress.current || "-"}</div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full bg-green-700"
                style={{
                  width:
                    progress.total > 0
                      ? `${Math.round(((progress.done + progress.fail) / progress.total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs">
          <b>활용 흐름</b> : {FLOW}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["전체", "분석대기", "분석완료", "판단규칙", "방송소재", "쇼츠소재"].map((v) => (
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

        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="자료명, 자료유형, AI판독, 핵심판단, 활용처 검색"
            className="flex-1 rounded-xl border bg-white px-4 py-3 text-sm"
          />
          <div className="rounded-xl border bg-white px-4 py-3 text-sm font-black">
            선택 {selectedIds.length}건
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border bg-white shadow">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[1500px] border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-gray-950 text-white">
                <tr>
                  <Th w="50px">선택</Th>
                  <Th w="95px">이미지</Th>
                  <Th w="230px">자료명</Th>
                  <Th w="65px">페이지</Th>
                  <Th w="130px">자료유형</Th>
                  <Th w="110px">AI상태</Th>
                  <Th w="180px">AI판독</Th>
                  <Th w="360px">핵심판단</Th>
                  <Th w="210px">다음작업</Th>
                  <Th w="180px">활용처</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">불러오는 중...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">자료가 없습니다.</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openRow(r)}
                      className={[
                        "cursor-pointer border-b hover:bg-green-50",
                        active?.id === r.id ? "bg-green-100" : "",
                      ].join(" ")}
                    >
                      <Td center>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggle(r.id)}
                        />
                      </Td>
                      <Td>
                        {r.image_url ? (
                          <img src={r.image_url} className="h-12 w-16 rounded border object-contain" alt="" />
                        ) : (
                          <div className="h-12 w-16 rounded border bg-gray-100 text-center text-[10px] leading-[48px]">없음</div>
                        )}
                      </Td>
                      <Td strong>{r.source_title || r.source_name || "자료명 필요"}</Td>
                      <Td center>{r.page_number || "-"}</Td>
                      <Td>{visualType(r)}</Td>
                      <Td><Badge status={status(r)} /></Td>
                      <Td>{reading(r)}</Td>
                      <Td>{r.key_info || r.ai_summary || "AI 정밀분석 대기"}</Td>
                      <Td>{r.next_action || "GPT Vision 분석"}</Td>
                      <Td>{useCase(r)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {active && (
        <aside className="fixed left-1/2 top-1/2 z-[9999] flex h-[88vh] w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b p-4">
            <div>
              <div className="text-xs font-black text-green-700">세환PD × AI 공동편집실</div>
              <h2 className="text-xl font-black">{active.source_title || active.source_name || "자료 상세"}</h2>
              <p className="text-xs text-gray-500">
                페이지 {active.page_number || "-"} / {active.db_location || "knowledge_visual_pages"}
              </p>
            </div>
            <button onClick={() => setActive(null)} className="rounded-lg border px-3 py-2 text-sm font-black">
              닫기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 rounded-xl border bg-gray-50 p-2">
              {active.image_url ? (
                <img src={active.image_url} className="mx-auto max-h-[290px] w-full object-contain" alt="" />
              ) : (
                <div className="flex h-48 items-center justify-center text-gray-500">이미지 없음</div>
              )}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
              <Field label="작물" value={active.crop_name || ""} onChange={(v) => updateActive("crop_name", v)} />
              <Field label="병해충" value={active.disease_name || ""} onChange={(v) => updateActive("disease_name", v)} />
              <Field label="생육단계" value={active.growth_stage || ""} onChange={(v) => updateActive("growth_stage", v)} />
            </div>

            <Field label="자료명" value={active.source_title || ""} onChange={(v) => updateActive("source_title", v)} />
            <Area label="핵심정보" value={active.key_info || ""} onChange={(v) => updateActive("key_info", v)} />
            <Area label="AI요약" value={active.ai_summary || ""} onChange={(v) => updateActive("ai_summary", v)} />
            <Area label="방송소재" value={active.broadcast_material || ""} onChange={(v) => updateActive("broadcast_material", v)} />
            <Area label="쇼츠소재" value={active.shorts_material || ""} onChange={(v) => updateActive("shorts_material", v)} />
            <Area label="농민 행동지시" value={active.action_instruction || ""} onChange={(v) => updateActive("action_instruction", v)} />
            <Area label="세환PD 메모" value={active.pd_memo || ""} onChange={(v) => updateActive("pd_memo", v)} />
            <Area label="수정요청 / 다음작업" value={active.next_action || ""} onChange={(v) => updateActive("next_action", v)} />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t bg-white p-4">
            <button onClick={() => analyzeOne(active.id)} disabled={busy} className="rounded-xl bg-black py-3 text-base font-black text-white">
              {busy ? "분석 중..." : "현재 자료 AI분석"}
            </button>
            <button onClick={saveActive} disabled={busy} className="rounded-xl bg-green-700 py-3 text-base font-black text-white">
              {busy ? "저장 중..." : "저장"}
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
        "max-w-[430px] overflow-hidden text-ellipsis whitespace-nowrap border-r px-3 py-2 align-middle",
        center ? "text-center" : "",
        strong ? "font-black" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function Badge({ status }: { status: string }) {
  const cls =
    status === "분석완료" || status === "검수필요"
      ? "bg-blue-100 text-blue-800"
      : "bg-yellow-100 text-yellow-800";

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-black ${cls}`}>
      {status}
    </span>
  );
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
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm leading-relaxed" />
    </label>
  );
}
