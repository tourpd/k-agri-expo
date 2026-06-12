"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

function num(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function won(v: unknown) {
  return `${Math.round(num(v)).toLocaleString()}원`;
}

export default function CreateOfferPage() {
  const params = useParams<{ id: string }>();
  const assetId = String(params.id || "");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    buyer_id: "",
    buyer_grade: "",
    verified_by: "",
    buyer_company_name: "",
    buyer_contact_name: "",
    buyer_phone: "",
    product_name: "",
    variety_name: "",
    producer_region: "",
    size_spec: "",
    offer_quantity: "",
    unit: "톤",
    offer_price: "",
    price_unit: "kg",
    title: "",
    message: "",
  });

  useEffect(() => {
    async function init() {
      const q = new URLSearchParams(window.location.search);

      const next = {
        buyer_id: q.get("buyer_id") || "",
        buyer_grade: q.get("buyer_grade") || "",
        verified_by: q.get("verified_by") || "",
        buyer_company_name: q.get("buyer_company_name") || "",
        buyer_contact_name: q.get("buyer_contact_name") || "",
        buyer_phone: q.get("buyer_phone") || "",
        product_name: q.get("product_name") || "",
        variety_name: q.get("variety_name") || "",
        producer_region: q.get("producer_region") || "",
        size_spec: q.get("size_spec") || "",
        offer_quantity: q.get("offer_quantity") || "",
        unit: q.get("unit") || "톤",
        offer_price: q.get("offer_price") || "",
        price_unit: q.get("price_unit") || "kg",
        title: q.get("title") || "",
        message: q.get("message") || "",
      };

      try {
        const res = await fetch(`/api/admin/agri-assets/${assetId}/create-offer/prefill?${q.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (json.ok) {
          const asset = json.asset || {};
          const buyer = json.buyer || {};

          next.product_name = next.product_name || asset.product_name || "";
          next.variety_name = next.variety_name || asset.variety_name || "";
          next.producer_region = next.producer_region || asset.producer_region || "";
          next.size_spec = next.size_spec || asset.size_spec || asset.main_grade || "";
          next.offer_quantity = next.offer_quantity || String(asset.total_quantity || "");
          next.unit = next.unit || asset.unit || "톤";
          next.offer_price = next.offer_price || String(asset.expected_price || "");

          next.buyer_id = next.buyer_id || buyer.id || "";
          next.buyer_grade = next.buyer_grade || buyer.buyer_grade || "";
          next.verified_by = next.verified_by || buyer.verified_by || "";
          next.buyer_company_name = next.buyer_company_name || buyer.company_name || "";
          next.buyer_contact_name = next.buyer_contact_name || buyer.contact_name || "";
          next.buyer_phone = next.buyer_phone || buyer.phone || "";
        }
      } catch {}

      const title =
        next.title ||
        `${next.producer_region} ${next.product_name} ${next.offer_quantity}${next.unit} 거래제안`.trim();

      const message =
        next.message ||
        `안녕하세요.

${next.producer_region}에서 생산된 ${next.product_name}을 공급 제안드립니다.

■ 품목 : ${next.product_name || "-"}
■ 품종 : ${next.variety_name || "-"}
■ 산지 : ${next.producer_region || "-"}
■ 규격 : ${next.size_spec || "-"}
■ 수량 : ${next.offer_quantity}${next.unit}
■ 제안단가 : ${Number(next.offer_price || 0).toLocaleString()}원/${next.price_unit}

샘플 제공 및 화상상담 가능합니다.
검토 부탁드립니다.`;

      setForm((prev) => ({
        ...prev,
        ...next,
        title,
        message,
      }));

      setLoading(false);
    }

    init();
  }, [assetId]);

  const totalAmount = useMemo(() => {
    const qty = num(form.offer_quantity);
    const price = num(form.offer_price);

    if (form.unit === "톤" && form.price_unit === "kg") return qty * 1000 * price;
    return qty * price;
  }, [form.offer_quantity, form.offer_price, form.unit, form.price_unit]);

  const calcText =
    form.unit === "톤" && form.price_unit === "kg"
      ? `${num(form.offer_quantity).toLocaleString()}톤 × 1,000kg × ${num(form.offer_price).toLocaleString()}원/kg`
      : `${num(form.offer_quantity).toLocaleString()}${form.unit} × ${num(form.offer_price).toLocaleString()}원/${form.price_unit}`;

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const res = await fetch(`/api/admin/agri-assets/${assetId}/create-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, offer_amount: totalAmount }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "저장 실패");
      return;
    }

    alert("거래제안 생성 완료");

    if (form.buyer_id) {
      location.href = `/admin/buyers/${form.buyer_id}`;
    } else {
      location.href = "/admin/trade-offers";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-6 text-black">
        <div className="mx-auto max-w-6xl border bg-white p-8 text-2xl font-black">
          거래제안 정보 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-6 text-black">
      <div className="mx-auto max-w-6xl border bg-white p-6">
        <h1 className="text-4xl font-black">거래제안 생성</h1>
        <p className="mt-2 text-lg font-bold text-neutral-600">
          추천 바이어를 선택하면 회사명·담당자·전화·수량·단가가 자동 입력됩니다.
        </p>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryBox title="품목" value={form.product_name || "-"} />
          <SummaryBox title="품종" value={form.variety_name || "-"} />
          <SummaryBox title="산지" value={form.producer_region || "-"} />
          <SummaryBox title="규격" value={form.size_spec || "-"} />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <SummaryBox title="제안수량" value={`${num(form.offer_quantity).toLocaleString()}${form.unit}`} />
          <SummaryBox title="제안단가" value={`${won(form.offer_price)}/${form.price_unit}`} />
          <div className="border bg-white p-5">
            <p className="text-sm font-black text-neutral-500">예상제안금액</p>
            <p className="mt-2 text-3xl font-black">{won(totalAmount)}</p>
            <p className="mt-2 text-xs font-black text-neutral-500">{calcText}</p>
          </div>
        </section>

        <section className="mt-6 border bg-white p-4">
          <h2 className="mb-4 text-xl font-black">추천 바이어 정보</h2>

          <div className="mb-4 flex items-center gap-2">
            <span className="rounded bg-black px-3 py-1 text-xs font-black text-white">
              {form.buyer_grade || "등급 없음"}
            </span>
            <span className="text-sm font-black text-neutral-600">
              검증자: {form.verified_by || "-"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="회사명">
              <input className="w-full border p-3 font-black" value={form.buyer_company_name} onChange={(e) => setField("buyer_company_name", e.target.value)} />
            </Field>

            <Field label="담당자">
              <input className="w-full border p-3 font-black" value={form.buyer_contact_name} onChange={(e) => setField("buyer_contact_name", e.target.value)} placeholder="담당자" />
            </Field>

            <Field label="전화번호">
              <input className="w-full border p-3 font-black" value={form.buyer_phone} onChange={(e) => setField("buyer_phone", e.target.value)} placeholder="전화번호" />
            </Field>
          </div>
        </section>

        <section className="mt-6 border bg-white p-4">
          <h2 className="mb-4 text-xl font-black">기본 정보</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="제안수량 *">
              <div className="flex gap-2">
                <input className="flex-1 border p-3 font-black" value={form.offer_quantity} onChange={(e) => setField("offer_quantity", e.target.value)} />
                <select className="w-28 border p-3 font-black" value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                  <option value="톤">톤</option>
                  <option value="kg">kg</option>
                  <option value="박스">박스</option>
                  <option value="망">망</option>
                  <option value="포대">포대</option>
                </select>
              </div>
            </Field>

            <Field label="제안단가 *">
              <div className="flex gap-2">
                <input className="flex-1 border p-3 font-black" value={form.offer_price} onChange={(e) => setField("offer_price", e.target.value)} />
                <select className="w-32 border p-3 font-black" value={form.price_unit} onChange={(e) => setField("price_unit", e.target.value)}>
                  <option value="kg">원/kg</option>
                  <option value="톤">원/톤</option>
                  <option value="박스">원/박스</option>
                  <option value="망">원/망</option>
                  <option value="포대">원/포대</option>
                </select>
              </div>
            </Field>

            <Field label="예상제안금액">
              <div className="border bg-neutral-100 p-3 text-xl font-black">{won(totalAmount)}</div>
            </Field>
          </div>
        </section>

        <section className="mt-6 border bg-white p-4">
          <h2 className="mb-4 text-xl font-black">제안 내용</h2>

          <div className="grid gap-4">
            <Field label="제안 제목 *">
              <input className="w-full border p-3 font-black" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Field>

            <Field label="제안 내용 *">
              <textarea className="w-full border p-3 font-black" rows={10} value={form.message} onChange={(e) => setField("message", e.target.value)} />
            </Field>
          </div>
        </section>

        <button onClick={save} className="mt-6 w-full bg-black p-5 text-xl font-black text-white">
          거래제안 저장
        </button>
      </div>
    </main>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white p-5">
      <p className="text-sm font-black text-neutral-500">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black">{label}</label>
      {children}
    </div>
  );
}
