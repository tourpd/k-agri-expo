import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    scope?: string;
    active?: string;
  }>;
};

function pct(v: number) {
  return `${Math.round(Number(v || 0) * 100)}%`;
}

function date(v?: string | null) {
  if (!v) return "-";

  return new Date(v).toLocaleDateString("ko-KR");
}

function scopeLabel(v?: string | null) {
  if (v === "order") return "주문";
  if (v === "product") return "상품";
  if (v === "brand") return "브랜드";
  if (v === "vendor") return "업체";
  if (v === "source") return "수익원";
  return "-";
}

function orderTypeLabel(v?: string | null) {
  if (v === "photodoctor") return "포토닥터";
  if (v === "general") return "일반";
  if (v === "live") return "라이브";
  return "-";
}

function statusLabel(active?: boolean) {
  return active ? "사용중" : "중지";
}

function statusClass(active?: boolean) {
  return active
    ? "text-emerald-700 bg-emerald-50"
    : "text-red-700 bg-red-50";
}

function LinkButton({
  href,
  children,
  tone = "white",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "white" | "blue" | "red";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white border-blue-600"
      : tone === "red"
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-slate-900 border-slate-300";

  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded border px-4 text-sm font-black ${cls}`}
    >
      {children}
    </Link>
  );
}

export default async function AdminCommissionRulesPage({
  searchParams,
}: PageProps) {
  const sp = (await searchParams) || {};

  const q = String(sp.q || "").trim().toLowerCase();
  const scope = String(sp.scope || "");
  const active = String(sp.active || "");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("commission_rules")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <main className="p-10 text-red-600">
        수수료 규칙 조회 오류
      </main>
    );
  }

  let rows = data || [];

  if (scope) {
    rows = rows.filter((r) => r.scope_type === scope);
  }

  if (active === "true") {
    rows = rows.filter((r) => r.is_active === true);
  }

  if (active === "false") {
    rows = rows.filter((r) => r.is_active === false);
  }

  if (q) {
    rows = rows.filter((r) => {
      return (
        String(r.title || "")
          .toLowerCase()
          .includes(q) ||
        String(r.memo || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }

  const activeCount = rows.filter((r) => r.is_active).length;
  const inactiveCount = rows.filter((r) => !r.is_active).length;

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">
              수수료 정책 관리
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-600">
              업체·브랜드·상품·라이브·주문별 수수료 규칙을 운영합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/revenue">
              수익센터
            </LinkButton>

            <LinkButton href="/admin/revenue/vendors">
              업체별 현황
            </LinkButton>

            <LinkButton href="/admin/settlements">
              정산센터
            </LinkButton>

            <LinkButton
              href="/admin/commission-rules/new"
              tone="blue"
            >
              규칙 추가
            </LinkButton>
          </div>
        </header>

        <form
          action="/admin/commission-rules"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-300 bg-white p-3"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="규칙명 검색"
            className="h-10 w-64 rounded border border-slate-300 px-3 text-sm font-bold"
          />

          <select
            name="scope"
            defaultValue={scope}
            className="h-10 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="">전체 범위</option>
            <option value="source">수익원</option>
            <option value="vendor">업체</option>
            <option value="brand">브랜드</option>
            <option value="product">상품</option>
            <option value="order">주문</option>
          </select>

          <select
            name="active"
            defaultValue={active}
            className="h-10 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="">전체 상태</option>
            <option value="true">사용중</option>
            <option value="false">중지</option>
          </select>

          <button className="h-10 rounded bg-slate-950 px-5 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1700px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  구분
                </th>

                <th className="border border-slate-300 px-3 py-2 text-left">
                  규칙명
                </th>

                <th className="border border-slate-300 px-3 py-2 text-left">
                  수익원
                </th>

                <th className="border border-slate-300 px-3 py-2 text-right">
                  수수료율
                </th>

                <th className="border border-slate-300 px-3 py-2 text-right">
                  우선순위
                </th>

                <th className="border border-slate-300 px-3 py-2 text-center">
                  시작일
                </th>

                <th className="border border-slate-300 px-3 py-2 text-center">
                  종료일
                </th>

                <th className="border border-slate-300 px-3 py-2 text-center">
                  상태
                </th>

                <th className="border border-slate-300 px-3 py-2 text-left">
                  메모
                </th>

                <th className="border border-slate-300 px-3 py-2 text-center">
                  수정
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-blue-50 font-black">
                <td className="border border-slate-300 px-3 py-2">
                  전체
                </td>

                <td className="border border-slate-300 px-3 py-2">
                  규칙 {rows.length}개
                </td>

                <td className="border border-slate-300 px-3 py-2">
                  사용중 {activeCount}개
                </td>

                <td className="border border-slate-300 px-3 py-2 text-right text-blue-700">
                  중지 {inactiveCount}개
                </td>

                <td
                  colSpan={6}
                  className="border border-slate-300 px-3 py-2"
                />
              </tr>

              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-yellow-50"
                >
                  <td className="border border-slate-300 px-3 py-2 font-black">
                    {scopeLabel(row.scope_type)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 font-black">
                    {row.title || "-"}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {orderTypeLabel(row.order_type)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">
                    {pct(row.commission_rate)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-black">
                    {row.priority}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-center">
                    {date(row.starts_at)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-center">
                    {date(row.ends_at)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-center">
                    <span
                      className={`inline-flex rounded px-2 py-1 text-xs font-black ${statusClass(
                        row.is_active
                      )}`}
                    >
                      {statusLabel(row.is_active)}
                    </span>
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {row.memo || "-"}
                  </td>

                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <LinkButton
                      href={`/admin/commission-rules/${row.id}`}
                    >
                      수정
                    </LinkButton>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="border border-slate-300 p-10 text-center font-black text-slate-500"
                  >
                    수수료 규칙이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}