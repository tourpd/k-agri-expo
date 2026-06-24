"use client";

import { useEffect, useMemo, useState } from "react";

type ConsultItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  crop?: string | null;
  province?: string | null;
  city?: string | null;
  issue?: string | null;
  diagnosis_id?: string | null;
  product_name?: string | null;
  area_text?: string | null;
  image_url?: string | null;
  message?: string | null;
  vendor_target?: string | null;
  commission_rate?: number | null;
  priority?: string | null;
  status?: string | null;
  admin_memo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function date(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ko-KR");
}

function statusLabel(v?: string | null) {
  switch (v) {
    case "new":
      return "신규";
    case "contacted":
      return "통화완료";
    case "done":
      return "처리완료";
    case "hold":
      return "보류";
    default:
      return v || "신규";
  }
}

function statusClass(v?: string | null) {
  switch (v) {
    case "new":
      return "bg-red-600 text-white";
    case "contacted":
      return "bg-blue-600 text-white";
    case "done":
      return "bg-green-600 text-white";
    case "hold":
      return "bg-amber-500 text-white";
    default:
      return "bg-neutral-700 text-white";
  }
}

function priorityLabel(v?: string | null) {
  if (v === "high") return "긴급";
  if (v === "medium") return "보통";
  return v || "보통";
}

export default function PhotoDoctorConsultsAdminPage() {
  const [items, setItems] = useState<ConsultItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [memo, setMemo] = useState("");

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  );

  const stats = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((x) => !x.status || x.status === "new").length,
      contacted: items.filter((x) => x.status === "contacted").length,
      done: items.filter((x) => x.status === "done").length,
      high: items.filter((x) => x.priority === "high").length,
    };
  }, [items]);

  async function fetchConsults() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/admin/photodoctor-consults", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상담 목록 조회 실패");
      }

      const list: ConsultItem[] = json.items || [];
      setItems(list);

      if (!selectedId || !list.some((x) => x.id === selectedId)) {
        setSelectedId(list?.[0]?.id || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "상담 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function convertToOrder(id: string) {
    setActing(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/admin/photodoctor-consults/convert-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consult_id: id }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "주문 전환 실패");
      }

      setNotice("상담 건을 주문으로 전환했습니다.");
      window.location.href = "/admin/photodoctor-orders";
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문 전환 실패");
    } finally {
      setActing(false);
    }
  }

  async function patchConsult(
    id: string,
    body: Record<string, unknown>,
    msg: string
  ) {
    setActing(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/photodoctor-consults/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상담 상태 수정 실패");
      }

      setNotice(msg);
      await fetchConsults();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상담 상태 수정 실패");
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    fetchConsults();
  }, []);

  useEffect(() => {
    setMemo(selected?.admin_memo || "");
  }, [selected?.id, selected?.admin_memo]);

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-4 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black">📞 포토닥터 상담관리</h1>
              <p className="mt-2 text-sm font-bold text-neutral-600">
                바로구매가 어렵거나 진단이 불확실한 고객 상담 요청을 관리합니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              <Stat title="전체" value={stats.total} />
              <Stat title="신규" value={stats.newCount} tone="red" />
              <Stat title="긴급" value={stats.high} tone="amber" />
              <Stat title="통화완료" value={stats.contacted} tone="blue" />
              <Stat title="처리완료" value={stats.done} tone="green" />
            </div>
          </div>
        </section>

        {(notice || error) && (
          <div className="mb-4">
            {notice && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-3 font-bold text-green-700">
                {notice}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 font-bold text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={fetchConsults}
              className="mb-4 w-full rounded-2xl bg-green-700 px-4 py-3 text-lg font-black text-white shadow-sm hover:bg-green-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "조회 중..." : "🔄 새로고침"}
            </button>

            <div className="max-h-[78vh] space-y-3 overflow-y-auto pr-1">
              {items.map((x) => {
                const active = x.id === selectedId;

                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setSelectedId(x.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      active
                        ? "border-green-500 bg-green-50 text-neutral-900"
                        : "border-neutral-200 bg-white hover:border-green-300"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="text-lg font-black">{x.name || "-"}</div>
                        <div className="mt-1 text-sm font-bold text-neutral-600">
                          {x.phone || "-"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            x.status
                          )}`}
                        >
                          {statusLabel(x.status)}
                        </div>
                        {x.priority === "high" && (
                          <div className="mt-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                            긴급
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-sm font-bold leading-6">
                      작물: {x.crop || "-"}
                      <br />
                      진단: {x.issue || "-"}
                      <br />
                      제품: {x.product_name || "-"}
                      <br />
                      사진: {x.image_url ? "있음" : "없음"}
                      <br />
                      접수: {date(x.created_at)}
                    </div>
                  </button>
                );
              })}

              {!loading && items.length === 0 && (
                <div className="rounded-2xl bg-neutral-50 p-5 text-center font-bold text-neutral-500">
                  상담 요청이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-5 shadow-sm">
            {!selected ? (
              <div className="rounded-2xl bg-neutral-50 p-5 font-bold text-neutral-600">
                좌측에서 상담 요청을 선택하세요.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border bg-yellow-50 p-5">
                  <h2 className="text-3xl font-black">{selected.name || "-"}</h2>

                  <div className="mt-4 grid gap-2 text-lg font-bold md:grid-cols-2">
                    <div>전화: {selected.phone || "-"}</div>
                    <div>상태: {statusLabel(selected.status)}</div>
                    <div>긴급도: {priorityLabel(selected.priority)}</div>
                    <div>제품: {selected.product_name || "-"}</div>
                    <div>작물: {selected.crop || "-"}</div>
                    <div>진단/증상: {selected.issue || "-"}</div>
                    <div>
                      지역: {selected.province || "-"} {selected.city || ""}
                    </div>
                    <div>면적: {selected.area_text || "-"}</div>
                    <div>연결업체: {selected.vendor_target || "-"}</div>
                    <div>
                      마진율:{" "}
                      {selected.commission_rate
                        ? `${Math.round(Number(selected.commission_rate) * 100)}%`
                        : "-"}
                    </div>
                    <div>진단ID: {selected.diagnosis_id || "-"}</div>
                    <div>접수: {date(selected.created_at)}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <a
                    href={`tel:${selected.phone || ""}`}
                    className="rounded-2xl bg-green-600 px-5 py-4 text-center text-lg font-black text-white no-underline shadow-sm hover:bg-green-700"
                  >
                    📞 전화하기
                  </a>

                  <button
                    disabled={acting}
                    onClick={() =>
                      patchConsult(
                        selected.id,
                        { status: "contacted" },
                        "통화완료 처리했습니다."
                      )
                    }
                    className="rounded-2xl bg-blue-600 px-5 py-4 text-lg font-black text-white disabled:opacity-50"
                  >
                    통화완료
                  </button>

                  <button
                    disabled={acting}
                    onClick={() => convertToOrder(selected.id)}
                    className="rounded-2xl bg-orange-500 px-5 py-4 text-lg font-black text-white disabled:opacity-50"
                  >
                    주문 전환
                  </button>

                  <button
                    disabled={acting}
                    onClick={() =>
                      patchConsult(
                        selected.id,
                        { status: "done" },
                        "처리완료 처리했습니다."
                      )
                    }
                    className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white disabled:opacity-50"
                  >
                    처리완료
                  </button>

                  <button
                    disabled={acting}
                    onClick={() =>
                      patchConsult(
                        selected.id,
                        { status: "hold" },
                        "보류 처리했습니다."
                      )
                    }
                    className="rounded-2xl bg-amber-500 px-5 py-4 text-lg font-black text-white disabled:opacity-50"
                  >
                    보류
                  </button>
                </div>

                {selected.image_url && (
                  <section className="rounded-3xl border p-5">
                    <h3 className="mb-3 text-xl font-black">
                      📷 고객 업로드 사진
                    </h3>

                    <a
                      href={selected.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-base font-black text-white no-underline shadow-sm hover:bg-blue-700"
                    >
                      🔍 원본 사진 크게 보기
                    </a>

                    <img
                      src={selected.image_url}
                      alt="고객 업로드 사진"
                      className="max-h-[520px] w-full rounded-2xl border object-contain"
                    />
                  </section>
                )}

                <section className="rounded-3xl border p-5">
                  <h3 className="mb-3 text-xl font-black">상담 내용</h3>
                  <div className="whitespace-pre-wrap rounded-2xl bg-neutral-50 p-4 font-bold leading-7">
                    {selected.message || "상담 내용 없음"}
                  </div>
                </section>

                <section className="rounded-3xl border p-5">
                  <h3 className="mb-3 text-xl font-black">관리자 메모</h3>

                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={5}
                    placeholder="통화 내용, 추가 요청, 처리 결과를 기록하세요."
                    className="w-full rounded-2xl border px-4 py-3 font-bold"
                  />

                  <button
                    disabled={acting}
                    onClick={() =>
                      patchConsult(
                        selected.id,
                        { admin_memo: memo },
                        "메모를 저장했습니다."
                      )
                    }
                    className="mt-3 rounded-2xl bg-neutral-800 px-5 py-3 font-black text-white shadow-sm hover:bg-neutral-900 disabled:opacity-50"
                  >
                    메모 저장
                  </button>
                </section>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number | string;
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
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}