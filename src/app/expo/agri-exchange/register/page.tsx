"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [form, setForm] = useState({
    asset_name: "",
    product_name: "",
    variety_name: "",
    producer_name: "",
    producer_region: "",
    size_spec: "",
    total_quantity: "",
    unit: "톤",
    expected_price: "",
    storage_location: "",
    memo: "",
  });

  function setField(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit() {
    const res = await fetch("/api/expo/agri-exchange/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "등록 실패");
      return;
    }

    alert("농산물 등록이 접수되었습니다.");
    location.href = "/expo/agri-exchange/market";
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-5 py-3 font-black text-white no-underline">
          ← K-Agri Expo
        </Link>

        <section className="mt-5 rounded-3xl border bg-white p-6 shadow">
          <p className="text-sm font-black text-green-700">K-AGRI 농산물거래소</p>
          <h1 className="mt-2 text-4xl font-black">내 농산물 등록하기</h1>
          <p className="mt-2 text-lg font-bold text-neutral-600">
            대량 판매 가능한 농산물을 등록하면 바이어가 검색하고 거래를 제안할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-4">
            <Input label="자산명" value={form.asset_name} onChange={(v) => setField("asset_name", v)} placeholder="예: 경북 영천 마늘 30톤" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="품목" value={form.product_name} onChange={(v) => setField("product_name", v)} placeholder="마늘" />
              <Input label="품종" value={form.variety_name} onChange={(v) => setField("variety_name", v)} placeholder="대서, 홍산 등" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="생산자명" value={form.producer_name} onChange={(v) => setField("producer_name", v)} placeholder="김용식" />
              <Input label="산지/지역" value={form.producer_region} onChange={(v) => setField("producer_region", v)} placeholder="경북 영천" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="규격" value={form.size_spec} onChange={(v) => setField("size_spec", v)} placeholder="대서 대과" />
              <Input label="수량" value={form.total_quantity} onChange={(v) => setField("total_quantity", v)} placeholder="30" />
              <div>
                <label className="mb-2 block font-black">단위</label>
                <select value={form.unit} onChange={(e) => setField("unit", e.target.value)} className="h-14 w-full rounded-xl border px-4 font-black">
                  <option value="톤">톤</option>
                  <option value="kg">kg</option>
                  <option value="박스">박스</option>
                  <option value="망">망</option>
                </select>
              </div>
            </div>
            <Input label="희망단가" value={form.expected_price} onChange={(v) => setField("expected_price", v)} placeholder="4000" />
            <Input label="보관위치" value={form.storage_location} onChange={(v) => setField("storage_location", v)} placeholder="영천 저온창고" />

            <div>
              <label className="mb-2 block font-black">메모</label>
              <textarea
                value={form.memo}
                onChange={(e) => setField("memo", e.target.value)}
                className="min-h-36 w-full rounded-xl border p-4 font-bold"
                placeholder="사진, 성적서, 유튜브 링크, 보관상태 등을 적어주세요."
              />
            </div>
          </div>

          <button onClick={submit} className="mt-6 w-full rounded-2xl bg-green-700 py-5 text-xl font-black text-white">
            농산물 등록 접수
          </button>
        </section>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block font-black">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-14 w-full rounded-xl border px-4 font-black" />
    </div>
  );
}
