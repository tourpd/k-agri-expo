// src/app/vendor/ai-sales/products/page.tsx

import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AISalesProductsPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("expo_ai_products")
    .select("*")
    .order("created_at", { ascending: false });

  const items = data || [];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black">
              AI 제품 관리
            </h1>

            <p className="mt-2 text-xl font-bold text-gray-600">
              AI 판매페이지 생성 제품 목록
            </p>
          </div>

          <Link
            href="/vendor/ai-sales"
            className="rounded-3xl bg-green-700 px-8 py-4 text-xl font-black text-white"
          >
            새 제품 등록
          </Link>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white shadow-xl">

          <table className="min-w-full">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="p-4 text-left">제품명</th>
                <th className="p-4 text-left">카테고리</th>
                <th className="p-4 text-left">판매가</th>
                <th className="p-4 text-left">공동구매가</th>
                <th className="p-4 text-left">판매방식</th>
                <th className="p-4 text-left">상태</th>
                <th className="p-4 text-left">등록일</th>
                <th className="p-4 text-left">관리</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-4 font-black">
                    {item.product_name}
                  </td>

                  <td className="p-4">
                    {item.category}
                  </td>

                  <td className="p-4 font-black text-red-600">
                    {(item.sale_price || 0).toLocaleString()}원
                  </td>

                  <td className="p-4 font-black text-blue-600">
                    {(item.group_buy_price || 0).toLocaleString()}원
                  </td>

                  <td className="p-4">
                    {item.sales_type}
                  </td>

                  <td className="p-4">
                    {item.status}
                  </td>

                  <td className="p-4">
                    {new Date(item.created_at)
                      .toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/vendor/ai-sales/products/${item.id}`}
                      className="rounded-xl bg-green-700 px-4 py-2 text-white"
                    >
                      보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </main>
  );
}