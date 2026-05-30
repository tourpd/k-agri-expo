import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceTable = "expo_orders" | "photodoctor_orders";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    source?: string;
    month?: string;
  }>;
};

function cleanText(v: FormDataEntryValue | null) {
  return String(v || "").trim();
}

function cleanNumber(v: FormDataEntryValue | null) {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function num(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(v: number) {
  return Math.round(v).toLocaleString("ko-KR");
}

function currentMonthKey() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

function validMonth(v?: string) {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : currentMonthKey();
}

function getAmount(row: any) {
  return (
    num(row.total_amount_krw) ||
    num(row.amount_krw) ||
    num(row.sale_price_krw) ||
    num(row.price_krw) ||
    num(row.order_amount_krw) ||
    num(row.total_price_krw) ||
    num(row.amount) ||
    num(row.price) ||
    num(row.total_price)
  );
}

function getBrandName(row: any, fallback = "") {
  return (
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    row.brand?.name ||
    row.expo_brands?.name ||
    row.vendor?.company_name ||
    row.vendors?.company_name ||
    fallback ||
    ""
  );
}

function getProductName(row: any) {
  return (
    row.product_name ||
    row.product_title ||
    row.item_name ||
    row.title ||
    row.product?.name ||
    row.products?.name ||
    ""
  );
}

function getBuyerName(row: any) {
  return (
    row.buyer_name ||
    row.applicant_name ||
    row.farmer_name ||
    row.name ||
    row.customer_name ||
    ""
  );
}

function getBuyerPhone(row: any) {
  return (
    row.buyer_phone ||
    row.phone ||
    row.farmer_phone ||
    row.customer_phone ||
    ""
  );
}

function normalizeRate(row: any, fallback: number) {
  const raw = num(row.platform_fee_rate ?? row.commission_rate);

  if (!raw) return fallback;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;

  return fallback;
}

function getErrorReasons(row: any, sourceTable: SourceTable) {
  const orderAmount = getAmount(row);
  const fallbackBrand = sourceTable === "photodoctor_orders" ? "포토닥터" : "-";
  const brandName = getBrandName(row, fallbackBrand);
  const productName = getProductName(row);
  const buyerName = getBuyerName(row);
  const buyerPhone = getBuyerPhone(row);
  const fallbackRate = sourceTable === "photodoctor_orders" ? 0.12 : 0.18;
  const rate = normalizeRate(row, fallbackRate);

  const reasons: string[] = [];

  if (!brandName || brandName === "-") reasons.push("업체명 없음");
  if (!productName) reasons.push("상품명 없음");
  if (orderAmount <= 0) reasons.push("주문금액 없음");
  if (!buyerName) reasons.push("구매자명 없음");
  if (!buyerPhone) reasons.push("연락처 없음");
  if (rate <= 0 || rate > 1) reasons.push("수수료율 이상");

  return reasons;
}

async function updateErrorOrder(formData: FormData) {
  "use server";

  const id = cleanText(formData.get("id"));
  const sourceTable = cleanText(formData.get("source_table")) as SourceTable;
  const month = cleanText(formData.get("month")) || currentMonthKey();

  const brandName = cleanText(formData.get("brand_name"));
  const productName = cleanText(formData.get("product_name"));
  const buyerName = cleanText(formData.get("buyer_name"));
  const buyerPhone = cleanText(formData.get("buyer_phone"));

  const orderAmount = cleanNumber(formData.get("order_amount"));
  const rateRaw = cleanNumber(formData.get("platform_fee_rate"));
  const platformFeeRate = rateRaw > 1 ? rateRaw / 100 : rateRaw;

  const platformFeeAmount = Math.round(orderAmount * platformFeeRate);
  const vendorSettlementAmount = Math.max(orderAmount - platformFeeAmount, 0);

  if (!id) throw new Error("주문 ID가 없습니다.");

  if (sourceTable !== "expo_orders" && sourceTable !== "photodoctor_orders") {
    throw new Error("주문 출처가 올바르지 않습니다.");
  }

  const admin = createSupabaseAdminClient();

  const { data: currentRow, error: readError } = await admin
    .from(sourceTable)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!currentRow) throw new Error("주문을 찾을 수 없습니다.");

  const payload: Record<string, any> = {};

  function setIfExists(column: string, value: any) {
    if (Object.prototype.hasOwnProperty.call(currentRow, column)) {
      payload[column] = value;
    }
  }

  if (sourceTable === "expo_orders") {
    setIfExists("brand_name", brandName);
    setIfExists("vendor_name", brandName);
    setIfExists("company_name", brandName);
    setIfExists("brand_title", brandName);
  }

  setIfExists("product_name", productName);
  setIfExists("product_title", productName);
  setIfExists("item_name", productName);
  setIfExists("title", productName);

  setIfExists("buyer_name", buyerName);
  setIfExists("applicant_name", buyerName);
  setIfExists("farmer_name", buyerName);
  setIfExists("name", buyerName);
  setIfExists("customer_name", buyerName);

  setIfExists("buyer_phone", buyerPhone);
  setIfExists("phone", buyerPhone);
  setIfExists("farmer_phone", buyerPhone);
  setIfExists("customer_phone", buyerPhone);

  setIfExists("total_amount_krw", orderAmount);
  setIfExists("amount_krw", orderAmount);
  setIfExists("sale_price_krw", orderAmount);
  setIfExists("price_krw", orderAmount);
  setIfExists("order_amount_krw", orderAmount);
  setIfExists("total_price_krw", orderAmount);
  setIfExists("amount", orderAmount);
  setIfExists("price", orderAmount);
  setIfExists("total_price", orderAmount);

  setIfExists("platform_fee_rate", platformFeeRate);
  setIfExists("commission_rate", platformFeeRate);
  setIfExists("platform_fee_amount", platformFeeAmount);
  setIfExists("platform_fee_amount_krw", platformFeeAmount);
  setIfExists("vendor_settlement_amount", vendorSettlementAmount);
  setIfExists("vendor_settlement_amount_krw", vendorSettlementAmount);
  setIfExists("settlement_status", "pending");
  setIfExists("updated_at", new Date().toISOString());

  if (Object.keys(payload).length === 0) {
    throw new Error("수정 가능한 컬럼을 찾지 못했습니다.");
  }

  const { error } = await admin.from(sourceTable).update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settlements");
  revalidatePath("/admin/settlements/errors");
  revalidatePath("/admin/revenue/orders");
  revalidatePath("/admin/revenue/vendors");
  revalidatePath("/admin/revenue");

  redirect(`/admin/settlements/errors?month=${month}`);
}

function LinkButton({
  href,
  children,
  tone = "white",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "white" | "blue" | "red" | "dark";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
      : tone === "red"
        ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
        : tone === "dark"
          ? "bg-slate-950 text-white border-slate-950 hover:bg-slate-800"
          : "bg-white text-slate-950 border-slate-300 hover:bg-slate-100";

  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded border px-4 text-sm font-black ${cls}`}
    >
      {children}
    </Link>
  );
}

export default async function SettlementErrorEditPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const month = validMonth(sp.month);
  const sourceParam = String(sp.source || "");

  const admin = createSupabaseAdminClient();

  let sourceTable: SourceTable | null = null;
  let row: any = null;

  if (sourceParam === "expo_orders" || sourceParam === "photodoctor_orders") {
    const { data } = await admin
      .from(sourceParam)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    sourceTable = sourceParam;
    row = data;
  } else {
    const [expoRes, photoRes] = await Promise.all([
      admin.from("expo_orders").select("*").eq("id", id).maybeSingle(),
      admin.from("photodoctor_orders").select("*").eq("id", id).maybeSingle(),
    ]);

    if (expoRes.data) {
      sourceTable = "expo_orders";
      row = expoRes.data;
    }

    if (!sourceTable && photoRes.data) {
      sourceTable = "photodoctor_orders";
      row = photoRes.data;
    }
  }

  if (!row || !sourceTable) {
    return (
      <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
        <div className="mx-auto max-w-4xl rounded border border-slate-300 bg-white p-8">
          <h1 className="text-2xl font-black">주문을 찾을 수 없습니다.</h1>
          <p className="mt-2 font-bold text-slate-600">
            원장 또는 오류정리 화면에서 다시 들어와 주세요.
          </p>
          <div className="mt-5">
            <LinkButton href={`/admin/settlements/errors?month=${month}`}>
              오류정리로 돌아가기
            </LinkButton>
          </div>
        </div>
      </main>
    );
  }

  const orderAmount = getAmount(row);
  const fallbackRate = sourceTable === "photodoctor_orders" ? 0.12 : 0.18;
  const rate = normalizeRate(row, fallbackRate);
  const platformFeeAmount = Math.round(orderAmount * rate);
  const vendorSettlementAmount = Math.max(orderAmount - platformFeeAmount, 0);

  const brandName = getBrandName(
    row,
    sourceTable === "photodoctor_orders" ? "포토닥터" : ""
  );

  const productName = getProductName(row);
  const buyerName = getBuyerName(row);
  const buyerPhone = getBuyerPhone(row);
  const reasons = getErrorReasons(row, sourceTable);

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">오류 주문 수정</h1>
            <p className="mt-2 text-sm font-bold text-slate-700">
              주문금액·상품명·구매자 정보를 보정하면 정산센터와 수익원장에 바로 반영됩니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href={`/admin/settlements/errors?month=${month}`}>
              오류정리
            </LinkButton>
            <LinkButton href={`/admin/settlements?month=${month}`}>
              정산센터
            </LinkButton>
            <LinkButton href={`/admin/revenue/orders?month=${month}`}>
              수익원장
            </LinkButton>
          </div>
        </header>

        <section className="rounded border border-red-300 bg-red-50 p-4">
          <div className="text-lg font-black text-red-700">현재 오류 사유</div>
          <div className="mt-2 text-base font-black text-red-700">
            {reasons.length > 0 ? reasons.join(", ") : "현재 오류 없음"}
          </div>
        </section>

        <section className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <tbody>
              <tr>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  주문 ID
                </th>
                <td className="border border-slate-300 px-3 py-2 font-bold">
                  {id}
                </td>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  출처
                </th>
                <td className="border border-slate-300 px-3 py-2 font-bold">
                  {sourceTable}
                </td>
              </tr>

              <tr>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  현재 주문금액
                </th>
                <td className="border border-slate-300 px-3 py-2 font-black">
                  {money(orderAmount)}
                </td>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  현재 정산금
                </th>
                <td className="border border-slate-300 px-3 py-2 font-black text-emerald-700">
                  {money(vendorSettlementAmount)}
                </td>
              </tr>

              <tr>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  현재 플랫폼수익
                </th>
                <td className="border border-slate-300 px-3 py-2 font-black text-blue-700">
                  {money(platformFeeAmount)}
                </td>
                <th className="border border-slate-300 bg-slate-200 px-3 py-2 text-left">
                  현재 수수료율
                </th>
                <td className="border border-slate-300 px-3 py-2 font-black">
                  {Math.round(rate * 100)}%
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <form
          action={updateErrorOrder}
          className="rounded border border-slate-300 bg-white p-5"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="source_table" value={sourceTable} />
          <input type="hidden" name="month" value={month} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm font-black">업체명</div>
              <input
                name="brand_name"
                defaultValue={brandName}
                disabled={sourceTable === "photodoctor_orders"}
                className="h-11 w-full rounded border border-slate-300 bg-white px-3 font-bold text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="예: 포토닥터"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-black">상품명</div>
              <input
                name="product_name"
                defaultValue={productName}
                className="h-11 w-full rounded border border-slate-300 bg-white px-3 font-bold text-slate-950"
                placeholder="예: 멸규니"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-black">구매자명</div>
              <input
                name="buyer_name"
                defaultValue={buyerName}
                className="h-11 w-full rounded border border-slate-300 bg-white px-3 font-bold text-slate-950"
                placeholder="구매자 이름"
              />
            </label>

            <label className="block">
  <div className="mb-1 text-sm font-black">주문금액</div>

  <input
    name="order_amount"
    defaultValue={money(orderAmount) + "원"}
    onChange={(e) => {
      const onlyNum = e.target.value.replace(/[^0-9]/g, "");

      if (!onlyNum) {
        e.target.value = "";
        return;
      }

      e.target.value =
        Number(onlyNum).toLocaleString("ko-KR") + "원";
    }}
    className="h-11 w-full rounded border border-slate-300 bg-white px-3 font-bold text-slate-950"
    placeholder="예: 61,000원"
  />
</label>

<label className="block">
  <div className="mb-1 text-sm font-black">수수료율</div>

  <input
    name="platform_fee_rate"
    defaultValue={rate}
    className="h-11 w-full rounded border border-slate-300 bg-white px-3 font-bold text-slate-950"
    placeholder="예: 0.12 또는 12"
  />
</label>
</div>

<div className="mt-5 rounded border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-slate-800">
  예: 주문금액 61,000원 / 수수료율 0.12 입력 시 플랫폼 수익 7,320원,
  업체정산 53,680원으로 다시 계산됩니다.
</div>

<div className="mt-5 flex justify-end gap-2">
  <LinkButton href={`/admin/settlements/errors?month=${month}`}>
    취소
  </LinkButton>

  <button className="h-10 rounded bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700">
    저장하고 오류정리로 돌아가기
  </button>
</div>
</form>
</div>
</main>
);
}