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
};

const FLOW =
  "자료화면 → knowledge_visual_pages DB → GPT Vision 분석 → 판단규칙 DB → 방송소재 → 쇼츠 → 농민상담 → 행동지시";

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState<Row | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState({
    total: 0,
    done: 0,
    fail: 0,
    current: "",
  });

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

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) =>
      [
        r.source_title,
        r.source_name,
        r.crop_name,
        r.disease_name,
        r.key_info,
        r.ai_summary,
        r.next_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.crop_name && r.crop_name !== "분석필요").length;
    return { total, wait: total - done, done, selected: selectedIds.length };
  }, [rows, selectedIds]);

  function openRow(row: Row) {
    setActive({
      ...row,
      db_location: row.db_location || "knowledge_visual_pages",
      usage_flow: row.usage_flow || FLOW,
    });
  }

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
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

  async function analyzeActive() {
    const id = active?.id || selectedIds[0];

    if (!id) {
      alert("분석할 자료를 먼저 선택하세요.");
      return;
    }

    setBusy(true);

    const res = await fetch("/api/admin/visual-knowledge/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "AI 분석 실패");
      setBusy(false);
      return;
    }

    if (active?.id === id && json.item) {
      setActive({ ...active, ...json.item });
    }

    await load();
    setBusy(false);
    alert("GPT Vision 분석 완료");
  }

  async function analyzeAll() {
    const targets = selectedIds.length
      ? rows.filter((r) => selectedIds.includes(r.id))
      : rows.filter((r) => !r.crop_name || r.crop_name === "분석필요");

    if (targets.length === 0) {
      alert("분석할 자료가 없습니다.");
      return;
    }

    const ok = confirm(
      `총 ${targets.length}건을 자동 분석합니다.\n시간이 걸릴 수 있습니다. 진행할까요?`
    );

    if (!ok) return;

    setAutoRunning(true);
    setBusy(true);
    setAutoProgress({
      total: targets.length,
      done: 0,
      fail: 0,
      current: "",
    });

    let done = 0;
    let fail = 0;

    for (const row of targets) {
      setAutoProgress({
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

        if (!res.ok) {
          fail += 1;
        } else {
          done += 1;
        }
      } catch {
        fail += 1;
      }

      setAutoProgress({
        total: targets.length,
        done,
        fail,
        current: `${row.source_title || row.source_name || "자료"} / ${row.page_number || "-"}p`,
      });
    }

    await load();

    setAutoRunning(false);
    setBusy(false);

    alert(`전체 자동분석 완료\n성공 ${done}건 / 실패 ${fail}건`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <section className="sticky top-0 z-20 mb-3 border-b bg-[#f4f7f2]/95 pb-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI EXPO / 농업 AI 두뇌센터
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              자료화면 AI DB센터
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              엑셀형 운영표에서 자료를 선택하고, 오른쪽 공동편집실에서 AI 분석·수정·저장합니다.
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
              disabled={busy || autoRunning}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white"
            >
              {autoRunning ? "자동분석 중..." : "🚀 전체 자동분석"}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <Stat label="전체자료" value={stats.total} />
          <Stat label="분석대기" value={stats.wait} />
          <Stat label="분석완료" value={stats.done} />
          <Stat label="선택자료" value={stats.selected} />
        </div>

        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs">
          <b>활용 흐름</b> : {FLOW}
        </div>

        {autoRunning && (
          <div className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
            <div className="font-black">
              AI 전체 자동분석 진행 중
            </div>
            <div className="mt-1">
              전체 {autoProgress.total}건 / 완료 {autoProgress.done}건 / 실패 {autoProgress.fail}건
            </div>
            <div className="mt-1 text-gray-600">
              현재 분석: {autoProgress.current || "-"}
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full bg-green-700"
                style={{
                  width:
                    autoProgress.total > 0
                      ? `${Math.round(((autoProgress.done + autoProgress.fail) / autoProgress.total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="자료명, 작물, 병해충, 핵심정보 검색"
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
            <table className="w-full min-w-[1180px] border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-gray-950 text-white">
                <tr>
                  <Th w="50px">선택</Th>
                  <Th w="95px">이미지</Th>
                  <Th w="230px">자료명</Th>
                  <Th w="70px">페이지</Th>
                  <Th w="120px">작물</Th>
                  <Th w="140px">병해충</Th>
                  <Th w="430px">AI요약</Th>
                  <Th w="220px">다음작업</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">불러오는 중...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">자료가 없습니다.</td>
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
                          <div className="h-12 w-16 rounded border bg-gray-100 text-center text-[10px] leading-[48px]">
                            없음
                          </div>
                        )}
                      </Td>
                      <Td strong>{r.source_title || r.source_name || "자료명 필요"}</Td>
                      <Td center>{r.page_number || "-"}</Td>
                      <Td>{r.crop_name || "분석필요"}</Td>
                      <Td>{r.disease_name || "-"}</Td>
                      <Td>{r.ai_summary || "-"}</Td>
                      <Td>{r.next_action || "GPT Vision 분석"}</Td>
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
              <div className="text-xs font-black text-green-700">
                세환PD × AI 공동편집실
              </div>
              <h2 className="text-xl font-black">
                {active.source_title || active.source_name || "자료 상세"}
              </h2>
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
                <div className="flex h-48 items-center justify-center text-gray-500">
                  이미지 없음
                </div>
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
            <button
              onClick={analyzeActive}
              disabled={busy}
              className="rounded-xl bg-black py-3 text-base font-black text-white"
            >
              {busy ? "분석 중..." : "현재 자료 AI분석"}
            </button>
            <button
              onClick={saveActive}
              disabled={busy}
              className="rounded-xl bg-green-700 py-3 text-base font-black text-white"
            >
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

function Td({
  children,
  center,
  strong,
}: {
  children: React.ReactNode;
  center?: boolean;
  strong?: boolean;
}) {
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mb-2 block">
      <div className="mb-1 text-xs font-black text-gray-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mb-2 block">
      <div className="mb-1 text-xs font-black text-gray-600">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm leading-relaxed"
      />
    </label>
  );
}
