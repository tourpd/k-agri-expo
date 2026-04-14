"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DealItem = {
  deal_id: string;
  title: string | null;
  product_name: string | null;
  summary: string | null;
  original_price_krw: number | null;
  deal_price_krw: number | null;
  discount_rate: number | null;
  stock_quantity: number | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string | null;
  created_at: string | null;
};

type DealForm = {
  title: string;
  product_name: string;
  summary: string;
  original_price_krw: string;
  deal_price_krw: string;
  stock_quantity: string;
  starts_at: string;
  ends_at: string;
  image_url: string;
};

function fmtKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR");
}

function calcDiscountRate(originalPrice: string, dealPrice: string) {
  const o = Number(originalPrice || 0);
  const d = Number(dealPrice || 0);
  if (!o || !d || o <= 0 || d <= 0 || d >= o) return 0;
  return Math.round(((o - d) / o) * 100);
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "draft":
      return "임시저장";
    case "active":
      return "판매중";
    case "paused":
      return "중지";
    case "ended":
      return "종료";
    default:
      return status || "-";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "draft":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    case "active":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "paused":
      return "border border-amber-200 bg-amber-100 text-amber-700";
    case "ended":
      return "border border-rose-200 bg-rose-100 text-rose-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function emptyForm(): DealForm {
  return {
    title: "",
    product_name: "",
    summary: "",
    original_price_krw: "",
    deal_price_krw: "",
    stock_quantity: "",
    starts_at: "",
    ends_at: "",
    image_url: "",
  };
}

export default function VendorDealsPage() {
  const [items, setItems] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const [form, setForm] = useState<DealForm>(emptyForm());
  const [editingId, setEditingId] = useState<string>("");

  const discountRate = useMemo(
    () => calcDiscountRate(form.original_price_krw, form.deal_price_krw),
    [form.original_price_krw, form.deal_price_krw]
  );

  async function loadDeals() {
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/vendor/deals", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "특가 목록을 불러오지 못했습니다.");
      }

      setItems(json.items || []);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "특가 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  function updateForm<K extends keyof DealForm>(key: K, value: DealForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId("");
    setErrorText("");
    setMessage("");
  }

  function fillFormForEdit(item: DealItem) {
    setEditingId(item.deal_id);
    setForm({
      title: item.title || "",
      product_name: item.product_name || "",
      summary: item.summary || "",
      original_price_krw: String(item.original_price_krw || ""),
      deal_price_krw: String(item.deal_price_krw || ""),
      stock_quantity: String(item.stock_quantity || ""),
      starts_at: item.starts_at ? item.starts_at.slice(0, 16) : "",
      ends_at: item.ends_at ? item.ends_at.slice(0, 16) : "",
      image_url: item.image_url || "",
    });
    setMessage("수정 모드입니다. 내용을 바꾼 뒤 저장해 주세요.");
    setErrorText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDeal() {
    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      if (!form.title.trim()) {
        throw new Error("특가 제목을 입력해 주세요.");
      }
      if (!form.product_name.trim()) {
        throw new Error("상품명을 입력해 주세요.");
      }
      if (!form.summary.trim()) {
        throw new Error("상품 요약 설명을 입력해 주세요.");
      }

      const originalPrice = Number(form.original_price_krw || 0);
      const dealPrice = Number(form.deal_price_krw || 0);
      const stockQuantity = Number(form.stock_quantity || 0);

      if (originalPrice <= 0) {
        throw new Error("정가를 올바르게 입력해 주세요.");
      }
      if (dealPrice <= 0) {
        throw new Error("특가를 올바르게 입력해 주세요.");
      }
      if (dealPrice >= originalPrice) {
        throw new Error("특가는 정가보다 낮아야 합니다.");
      }
      if (stockQuantity < 0) {
        throw new Error("재고 수량을 확인해 주세요.");
      }

      const payload = {
        deal_id: editingId || null,
        title: form.title.trim(),
        product_name: form.product_name.trim(),
        summary: form.summary.trim(),
        original_price_krw: originalPrice,
        deal_price_krw: dealPrice,
        discount_rate: discountRate,
        stock_quantity: stockQuantity,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        image_url: form.image_url.trim() || null,
      };

      const res = await fetch("/api/vendor/deals", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "특가 저장에 실패했습니다.");
      }

      setMessage(editingId ? "특가가 수정되었습니다." : "특가가 등록되었습니다.");
      resetForm();
      await loadDeals();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "특가 저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(dealId: string, nextStatus: string) {
    try {
      setBusyId(dealId);
      setErrorText("");
      setMessage("");

      const res = await fetch("/api/vendor/deals/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deal_id: dealId,
          status: nextStatus,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상태 변경에 실패했습니다.");
      }

      setMessage("특가 상태가 변경되었습니다.");
      await loadDeals();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setBusyId("");
    }
  }

  async function removeDeal(dealId: string) {
    const ok = window.confirm("이 특가를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      setBusyId(dealId);
      setErrorText("");
      setMessage("");

      const res = await fetch(`/api/vendor/deals?deal_id=${dealId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "삭제에 실패했습니다.");
      }

      setMessage("특가가 삭제되었습니다.");
      if (editingId === dealId) {
        resetForm();
      }
      await loadDeals();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "삭제에 실패했습니다."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-2xl md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black tracking-wide text-emerald-300">
                EXPO DEALS
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                엑스포 특가 관리
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                엑스포 방문자가 가장 먼저 반응하는 건 특가 상품입니다. 제목,
                상품 설명, 정가/특가, 재고, 판매 기간을 등록해 노출 흐름을 직접
                운영해 보세요.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendor/dashboard"
                className="rounded-2xl border border-slate-600 px-4 py-3 text-sm font-black text-white"
              >
                대시보드로 이동
              </Link>
              <button
                type="button"
                onClick={loadDeals}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white"
              >
                목록 새로고침
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {errorText}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black text-emerald-700">
                  DEAL EDITOR
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  {editingId ? "특가 수정" : "특가 등록"}
                </h2>
              </div>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800"
                >
                  새로 작성
                </button>
              ) : null}
            </div>

            <div className="grid gap-4">
              <InputField
                label="특가 제목"
                value={form.title}
                onChange={(v) => updateForm("title", v)}
                placeholder="예: 4월 한정 싹쓰리충 특가"
              />

              <InputField
                label="상품명"
                value={form.product_name}
                onChange={(v) => updateForm("product_name", v)}
                placeholder="예: 싹쓰리충 골드"
              />

              <TextAreaField
                label="상품 요약 설명"
                value={form.summary}
                onChange={(v) => updateForm("summary", v)}
                rows={4}
                placeholder="예: 총채벌레, 응애, 주요 해충 관리용 유기농업자재"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <InputField
                  label="정가(원)"
                  value={form.original_price_krw}
                  onChange={(v) => updateForm("original_price_krw", onlyDigits(v))}
                  placeholder="예: 50000"
                />
                <InputField
                  label="특가(원)"
                  value={form.deal_price_krw}
                  onChange={(v) => updateForm("deal_price_krw", onlyDigits(v))}
                  placeholder="예: 39000"
                />
                <ReadOnlyField
                  label="할인율"
                  value={discountRate > 0 ? `${discountRate}%` : "-"}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <InputField
                  label="재고 수량"
                  value={form.stock_quantity}
                  onChange={(v) => updateForm("stock_quantity", onlyDigits(v))}
                  placeholder="예: 100"
                />
                <DateTimeField
                  label="시작일시"
                  value={form.starts_at}
                  onChange={(v) => updateForm("starts_at", v)}
                />
                <DateTimeField
                  label="종료일시"
                  value={form.ends_at}
                  onChange={(v) => updateForm("ends_at", v)}
                />
              </div>

              <InputField
                label="상품 이미지 URL"
                value={form.image_url}
                onChange={(v) => updateForm("image_url", v)}
                placeholder="https://"
              />

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-black text-slate-700">운영 팁</div>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                  <div>• 제목에는 기간 한정, 수량 한정, 대표 효능을 함께 넣으면 반응이 좋습니다.</div>
                  <div>• 특가는 정가보다 분명히 낮아야 방문자 설득력이 생깁니다.</div>
                  <div>• 재고를 너무 크게 잡지 말고 실제 운영 가능한 수량으로 관리하세요.</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveDeal}
                  disabled={saving}
                  className="rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : editingId ? "특가 수정 저장" : "특가 등록"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-900"
                >
                  입력 초기화
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <StatCard title="등록 특가 수" value={String(items.length)} />
            <StatCard
              title="판매중 특가"
              value={String(items.filter((x) => x.status === "active").length)}
            />
            <StatCard
              title="임시저장"
              value={String(items.filter((x) => x.status === "draft").length)}
            />
            <StatCard
              title="평균 할인율"
              value={
                items.length > 0
                  ? `${Math.round(
                      items.reduce((sum, item) => sum + Number(item.discount_rate || 0), 0) /
                        items.length
                    )}%`
                  : "0%"
              }
            />
          </section>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="text-sm font-black text-emerald-700">MY DEALS</div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              등록한 특가 목록
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500">
              특가를 불러오는 중...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500">
              아직 등록된 특가가 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.deal_id}
                  className="rounded-[24px] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        {item.title || "-"}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        {item.product_name || "-"}
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusClass(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    {item.summary || "설명 없음"}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniInfo title="정가" value={fmtKrw(item.original_price_krw)} />
                    <MiniInfo title="특가" value={fmtKrw(item.deal_price_krw)} />
                    <MiniInfo title="할인율" value={`${Number(item.discount_rate || 0)}%`} />
                    <MiniInfo title="재고" value={`${Number(item.stock_quantity || 0)}개`} />
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                    <div>
                      <b>시작:</b> {fmtDateTime(item.starts_at)}
                    </div>
                    <div>
                      <b>종료:</b> {fmtDateTime(item.ends_at)}
                    </div>
                    <div>
                      <b>등록일:</b> {fmtDateTime(item.created_at)}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fillFormForEdit(item)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800"
                    >
                      수정
                    </button>

                    {item.status !== "active" ? (
                      <button
                        type="button"
                        onClick={() => changeStatus(item.deal_id, "active")}
                        disabled={busyId === item.deal_id}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                      >
                        판매중 전환
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeStatus(item.deal_id, "paused")}
                        disabled={busyId === item.deal_id}
                        className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                      >
                        일시중지
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => changeStatus(item.deal_id, "ended")}
                      disabled={busyId === item.deal_id}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"
                    >
                      종료
                    </button>

                    <button
                      type="button"
                      onClick={() => removeDeal(item.deal_id)}
                      disabled={busyId === item.deal_id}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <textarea
        value={value}
        rows={rows || 4}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
      />
    </label>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-slate-800">{label}</div>
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-900">
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function MiniInfo({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}