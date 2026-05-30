"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  farmer_name?: string | null;
  farmer_phone?: string | null;
  product_name?: string | null;
  crop_name?: string | null;
  issue_type?: string | null;
  area_text?: string | null;
  message?: string | null;
  source_type?: string | null;
  source_ref_id?: string | null;
  vendor_target?: string | null;
  commission_rate?: number | null;
  sale_status?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: string | null;
  last_contacted_at?: string | null;
  admin_memo?: string | null;
};

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ko-KR");
}

function rate(v?: number | null) {
  if (v == null) return "-";
  return `${Math.round(Number(v) * 100)}%`;
}

function statusLabel(v?: string | null) {
  switch (v) {
    case "new":
      return "신규";
    case "contacted":
      return "통화완료";
    case "sent":
      return "도프전달";
    case "quoted":
      return "견적안내";
    case "won":
      return "판매성사";
    case "lost":
      return "실패";
    default:
      return v || "신규";
  }
}

function isHot(x: Lead) {
  return (
    x.priority === "high" ||
    x.source_type === "photodoctor_product" ||
    ["탄저", "역병", "흰가루", "노균", "총채", "진딧", "응애", "썩음"].some((k) =>
      `${x.issue_type || ""} ${x.message || ""}`.includes(k)
    )
  );
}

export default function PhotoDoctorLeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  );

  const stats = useMemo(() => {
    return {
      total: items.length,
      fresh: items.filter((x) => !x.sale_status || x.sale_status === "new").length,
      dof: items.filter((x) => x.vendor_target === "dof").length,
      contacted: items.filter((x) => x.sale_status === "contacted").length,
      won: items.filter((x) => x.sale_status === "won").length,
      hot: items.filter(isHot).length,
    };
  }, [items]);

  async function fetchItems(nextTab = tab) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (nextTab) params.set("sale_status", nextTab);

      const res = await fetch(`/api/admin/photodoctor-leads?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "조회 실패");
      }

      setItems(json.items || []);
      setSelectedId(json.items?.[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    setError("");
    setNotice("");

    const res = await fetch(`/api/admin/photodoctor-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json.error || "수정 실패");
      return;
    }

    setNotice(msg);
    await fetchItems();
  }

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-4 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black">📷 포토닥터 리드 접수함</h1>
              <p className="mt-2 text-sm font-bold text-neutral-600">
                300명 이상 들어와도 빠르게 전화·도프전달·판매처리하는 단순 운영 화면입니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              <Stat title="전체" value={stats.total} />
              <Stat title="HOT" value={stats.hot} tone="red" />
              <Stat title="신규" value={stats.fresh} tone="amber" />
              <Stat title="도프" value={stats.dof} tone="green" />
              <Stat title="통화" value={stats.contacted} tone="blue" />
              <Stat title="성사" value={stats.won} tone="green" />
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
            <div className="grid grid-cols-2 gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름·전화·제품·작물 검색"
                className="col-span-2 rounded-2xl border px-4 py-3 font-bold"
              />

              {[
                ["", "전체"],
                ["new", "신규"],
                ["sent", "도프전달"],
                ["contacted", "통화완료"],
                ["won", "판매성사"],
                ["lost", "실패"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setTab(value);
                    fetchItems(value);
                  }}
                  className={`rounded-2xl border px-4 py-3 font-black ${
                    tab === value ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={() => fetchItems()}
                className="col-span-2 rounded-2xl bg-green-600 px-4 py-3 font-black text-white"
              >
                {loading ? "조회 중..." : "검색 / 새로고침"}
              </button>
            </div>

            <div className="mt-4 max-h-[75vh] space-y-3 overflow-y-auto pr-1">
              {items.map((x) => {
                const selectedCard = x.id === selectedId;

                return (
                  <button
                    key={x.id}
                    onClick={() => setSelectedId(x.id)}
                    className={`w-full rounded-3xl border p-4 text-left ${
                      selectedCard
                        ? "border-black bg-black text-white"
                        : isHot(x)
                        ? "border-red-200 bg-red-50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="text-lg font-black">
                          {x.farmer_name || "이름 없음"}
                        </div>
                        <div className="mt-1 text-sm font-bold opacity-80">
                          {x.farmer_phone || "연락처 없음"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black">{rate(x.commission_rate)}</div>
                        <div className="mt-1 rounded-full bg-white px-2 py-1 text-xs font-black text-black">
                          {statusLabel(x.sale_status)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isHot(x) && (
                        <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">
                          🔥 HOT
                        </span>
                      )}
                      {x.vendor_target === "dof" && (
                        <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-black text-white">
                          도프
                        </span>
                      )}
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">
                        {x.product_name || "제품 미정"}
                      </span>
                    </div>

                    <div className="mt-3 text-sm font-bold leading-6 opacity-90">
                      작물: {x.crop_name || "-"}
                      <br />
                      진단: {x.issue_type || "-"}
                      <br />
                      접수: {formatDate(x.created_at)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-5 shadow-sm">
            {!selected ? (
              <div className="rounded-2xl bg-neutral-50 p-5 font-bold text-neutral-600">
                좌측에서 리드를 선택하세요.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border bg-green-50 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-black">
                      {selected.farmer_name || "이름 없음"}
                    </h2>

                    {isHot(selected) && (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-black text-white">
                        🔥 HOT
                      </span>
                    )}

                    <span className="rounded-full bg-black px-3 py-1 text-sm font-black text-white">
                      {statusLabel(selected.sale_status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-lg font-bold md:grid-cols-2">
                    <div>전화: {selected.farmer_phone || "-"}</div>
                    <div>제품: {selected.product_name || "-"}</div>
                    <div>작물: {selected.crop_name || "-"}</div>
                    <div>진단: {selected.issue_type || "-"}</div>
                    <div>면적: {selected.area_text || "-"}</div>
                    <div>업체: {selected.vendor_target || "미지정"}</div>
                    <div>마진: {rate(selected.commission_rate)}</div>
                    <div>접수: {formatDate(selected.created_at)}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <a
                    href={`tel:${selected.farmer_phone || ""}`}
                    className="rounded-2xl bg-black px-5 py-4 text-center text-lg font-black text-white no-underline"
                    onClick={() =>
                      patch(selected.id, { mark_contacted: true }, "통화 상태로 변경했습니다.")
                    }
                  >
                    📞 전화하기
                  </a>

                  <button
                    onClick={() =>
                      patch(
                        selected.id,
                        { assign_dof: true, commission_rate: selected.product_name?.includes("싹쓰리충") ? 0.25 : 0.3 },
                        "도프 전달 대상으로 지정했습니다."
                      )
                    }
                    className="rounded-2xl bg-green-600 px-5 py-4 text-lg font-black text-white"
                  >
                    🚚 도프전달
                  </button>

                  <button
                    onClick={() =>
                      patch(selected.id, { sale_status: "won" }, "판매성사 처리했습니다.")
                    }
                    className="rounded-2xl bg-blue-600 px-5 py-4 text-lg font-black text-white"
                  >
                    ✅ 판매성사
                  </button>

                  <button
                    onClick={() =>
                      patch(selected.id, { sale_status: "lost" }, "판매실패 처리했습니다.")
                    }
                    className="rounded-2xl bg-red-600 px-5 py-4 text-lg font-black text-white"
                  >
                    ❌ 실패
                  </button>
                </div>

                <section className="rounded-3xl border p-5">
                  <h3 className="mb-3 text-xl font-black">문의 내용</h3>
                  <div className="whitespace-pre-wrap rounded-2xl bg-neutral-50 p-4 font-bold leading-7">
                    {selected.message || "문의 내용 없음"}
                  </div>
                </section>

                <section className="rounded-3xl border p-5">
                  <h3 className="mb-3 text-xl font-black">운영 판단</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      onClick={() =>
                        patch(selected.id, { sale_status: "contacted" }, "통화완료 처리했습니다.")
                      }
                      className="rounded-2xl border px-4 py-3 font-black"
                    >
                      통화완료
                    </button>
                    <button
                      onClick={() =>
                        patch(selected.id, { sale_status: "quoted" }, "견적안내 처리했습니다.")
                      }
                      className="rounded-2xl border px-4 py-3 font-black"
                    >
                      견적안내
                    </button>
                    <button
                      onClick={() =>
                        patch(selected.id, { sale_status: "closed" }, "종결 처리했습니다.")
                      }
                      className="rounded-2xl border px-4 py-3 font-black"
                    >
                      종결
                    </button>
                  </div>
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
  value: number;
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
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}