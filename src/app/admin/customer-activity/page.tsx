"use client";

import { useEffect, useMemo, useState } from "react";

type ActivityLog = {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  activity_type?: string | null;
  activity_title?: string | null;
  activity_value?: string | null;
  source_channel?: string | null;
  source_page?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function typeLabel(v?: string | null) {
  const t = safe(v);
  if (t === "video_watch") return "영상시청";
  if (t === "page_view") return "페이지방문";
  if (t === "product_click") return "상품클릭";
  if (t === "consult") return "상담";
  if (t === "order") return "주문";
  if (t === "education") return "교육참여";
  if (t === "groupbuy") return "공동구매";
  if (t === "expo_visit") return "박람회방문";
  return t || "-";
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).slice(0, 16).replace("T", " ");
}

export default function CustomerActivityPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customer-activity?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "고객 활동 로그 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "고객 활동 로그 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return items.filter((x) => {
      if (type !== "all" && x.activity_type !== type) return false;

      const hay = [
        x.customer_name,
        x.phone,
        x.activity_type,
        x.activity_title,
        x.activity_value,
        x.source_channel,
        x.source_page,
        x.memo,
      ]
        .join(" ")
        .toLowerCase();

      if (keyword && !hay.includes(keyword)) return false;
      return true;
    });
  }, [items, q, type]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      video: items.filter((x) => x.activity_type === "video_watch").length,
      click: items.filter((x) => x.activity_type === "product_click").length,
      consult: items.filter((x) => x.activity_type === "consult").length,
      order: items.filter((x) => x.activity_type === "order").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">
              K-AGRI CUSTOMER ACTIVITY LOG
            </p>
            <h1 className="text-3xl font-black">고객 활동 로그 센터</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white"
            >
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">
              CRM 추출
            </button>
            <button className="h-10 rounded bg-black px-4 text-sm font-black text-white">
              엑셀 다운로드
            </button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-5 gap-2">
          <MiniStat title="전체" value={`${stats.total}건`} />
          <MiniStat title="영상시청" value={`${stats.video}건`} />
          <MiniStat title="상품클릭" value={`${stats.click}건`} />
          <MiniStat title="상담" value={`${stats.consult}건`} />
          <MiniStat title="주문" value={`${stats.order}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-6 gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 border px-3 text-sm font-bold"
              placeholder="고객명·전화·내용 통합검색"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 border px-3 text-sm font-bold"
            >
              <option value="all">전체 활동</option>
              <option value="video_watch">영상시청</option>
              <option value="page_view">페이지방문</option>
              <option value="product_click">상품클릭</option>
              <option value="consult">상담</option>
              <option value="order">주문</option>
              <option value="education">교육참여</option>
              <option value="groupbuy">공동구매</option>
              <option value="expo_visit">박람회방문</option>
            </select>

            <input className="h-10 border px-3 text-sm font-bold" placeholder="유입채널" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="시작일" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="종료일" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">
              검색
            </button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {filtered.length}건 / 전체 {items.length}건
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>일시</Th>
                  <Th>고객명</Th>
                  <Th>전화</Th>
                  <Th>활동유형</Th>
                  <Th>활동내용</Th>
                  <Th>값</Th>
                  <Th>유입채널</Th>
                  <Th>페이지</Th>
                  <Th>메모</Th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border p-8 text-center font-black text-neutral-500">
                      활동 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td>{shortDate(x.created_at)}</Td>
                      <Td strong>{x.customer_name || "-"}</Td>
                      <Td>{x.phone || "-"}</Td>
                      <Td strong>{typeLabel(x.activity_type)}</Td>
                      <Td>{x.activity_title || "-"}</Td>
                      <Td>{x.activity_value || "-"}</Td>
                      <Td>{x.source_channel || "-"}</Td>
                      <Td>{x.source_page || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky top-0 whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">
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
      className={`whitespace-nowrap border border-neutral-200 px-2 py-2 ${
        strong ? "font-black" : "font-bold text-neutral-700"
      }`}
    >
      {children}
    </td>
  );
}
