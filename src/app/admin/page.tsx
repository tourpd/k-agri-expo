import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminDashboardPage() {
  // KPI 데이터
  const { data: orders } = await supabase.from("expo_orders").select("*");

  const total = orders?.length || 0;
  const pending = orders?.filter((o) => o.payment_status === "pending").length || 0;
  const paid = orders?.filter((o) => o.payment_status === "paid").length || 0;
  const completed =
    orders?.filter((o) => o.order_status === "approved").length || 0;

  // 최근 주문
  const { data: recentOrders } = await supabase
    .from("expo_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="p-6 space-y-6">
      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="총 주문" value={total} />
        <KpiCard title="입금 대기" value={pending} color="yellow" />
        <KpiCard title="입금 완료" value={paid} color="green" />
        <KpiCard title="부스 생성" value={completed} color="blue" />
      </section>

      {/* 최근 주문 */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">최근 주문</h2>

        {recentOrders?.length === 0 ? (
          <div>주문이 없습니다</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th>회사명</th>
                <th>상품</th>
                <th>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((o) => (
                <tr key={o.id} className="border-b">
                  <td>{o.company_name}</td>
                  <td>{o.product_name}</td>
                  <td>{(o.amount_krw || 0).toLocaleString()}원</td>
                  <td>{o.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 알림 */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">알림</h2>

        <div className="space-y-2">
          {pending > 0 && (
            <div className="text-red-600 font-bold">
              입금 대기 주문 {pending}건 있습니다
            </div>
          )}
          {paid > completed && (
            <div className="text-orange-600 font-bold">
              부스 미생성 주문 {paid - completed}건
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  title,
  value,
  color = "gray",
}: {
  title: string;
  value: number;
  color?: "gray" | "green" | "yellow" | "blue";
}) {
  const colorMap = {
    gray: "bg-slate-900",
    green: "bg-emerald-600",
    yellow: "bg-yellow-500",
    blue: "bg-blue-600",
  };

  return (
    <div className={`${colorMap[color]} text-white p-5 rounded-2xl`}>
      <div className="text-sm">{title}</div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}