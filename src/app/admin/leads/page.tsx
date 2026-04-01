"use client";

import { useEffect, useMemo, useState } from "react";

type BoothLead = {
  lead_id: string;
  booth_id: string;
  vendor_id?: string | null;
  hall_id?: string | null;
  slot_code?: string | null;

  farmer_name?: string | null;
  farmer_phone?: string | null;
  farmer_email?: string | null;

  crop_name?: string | null;
  area_text?: string | null;
  issue_type?: string | null;
  message?: string | null;

  source_type?: string | null;
  source_ref_id?: string | null;

  status?: string | null;
  priority?: string | null;
  assigned_to_email?: string | null;

  first_contacted_at?: string | null;
  quoted_at?: string | null;
  won_at?: string | null;
  lost_at?: string | null;
  closed_at?: string | null;

  estimated_amount_krw?: number | null;
  final_amount_krw?: number | null;
  commission_rate?: number | null;
  commission_amount_krw?: number | null;

  memo?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("ko-KR");
}

function formatKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "new":
      return "신규";
    case "contacted":
      return "연락완료";
    case "quoted":
      return "견적완료";
    case "won":
      return "거래성사";
    case "lost":
      return "실패";
    case "closed":
      return "종결";
    default:
      return status || "-";
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "new":
      return "bg-amber-100 text-amber-800";
    case "contacted":
      return "bg-blue-100 text-blue-800";
    case "quoted":
      return "bg-indigo-100 text-indigo-800";
    case "won":
      return "bg-emerald-100 text-emerald-800";
    case "lost":
      return "bg-red-100 text-red-800";
    case "closed":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default function AdminLeadsPage() {
  const [items, setItems] = useState<BoothLead[]>([]);
  const [selected, setSelected] = useState<BoothLead | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/admin/booth-leads");
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function updateLead(leadId: string, payload: any) {
    const res = await fetch(`/api/admin/booth-leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      alert(json.error || "실패");
      return;
    }

    loadItems();
    setSelected(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">상담 관리</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>이름</th>
            <th>작물</th>
            <th>상태</th>
            <th>금액</th>
            <th>수수료</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.lead_id}>
              <td>{item.farmer_name}</td>
              <td>{item.crop_name}</td>
              <td>{getStatusLabel(item.status)}</td>
              <td>{formatKrw(item.final_amount_krw)}</td>
              <td>{formatKrw(item.commission_amount_krw)}</td>
              <td>
                <button onClick={() => setSelected(item)}>상세</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 상세 팝업 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 p-10">
          <div className="bg-white p-6 rounded-xl max-w-2xl mx-auto">

            <h2 className="text-xl font-bold mb-4">상담 상세</h2>

            <div className="mb-4">
              {selected.farmer_name} / {selected.crop_name}
            </div>

            {/* 상태 변경 */}
            <div className="mb-4">
              <div className="font-bold mb-2">상태 변경</div>
              {["new", "contacted", "quoted", "won", "lost"].map((s) => (
                <button
                  key={s}
                  className="mr-2 border px-2 py-1"
                  onClick={() =>
                    updateLead(selected.lead_id, {
                      action: "change_status",
                      status: s,
                    })
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            {/* 거래 성사 */}
            <TransactionForm
              selected={selected}
              onSubmit={(data) =>
                updateLead(selected.lead_id, {
                  action: "mark_won",
                  ...data,
                })
              }
            />

            <button
              className="mt-6 border px-4 py-2"
              onClick={() => setSelected(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* 거래 처리 */
function TransactionForm({
  selected,
  onSubmit,
}: {
  selected: BoothLead;
  onSubmit: (data: any) => void;
}) {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("0.07");

  const commission = Math.round(Number(amount || 0) * Number(rate));

  return (
    <div>
      <div className="font-bold mt-4">거래 성사</div>

      <input
        placeholder="금액"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border w-full p-2 mt-2"
      />

      <select
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="border w-full p-2 mt-2"
      >
        <option value="0.10">10%</option>
        <option value="0.07">7%</option>
        <option value="0.05">5%</option>
      </select>

      <div className="mt-2">수수료: {commission.toLocaleString()}원</div>

      <button
        className="mt-3 bg-green-600 text-white px-4 py-2"
        onClick={() =>
          onSubmit({
            final_amount_krw: Number(amount),
            commission_rate: Number(rate),
          })
        }
      >
        거래 완료
      </button>
    </div>
  );
}