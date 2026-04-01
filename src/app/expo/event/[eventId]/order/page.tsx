"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatKoreanPhone } from "@/lib/phone";

function fmtKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

type FarmerMe = {
  name: string;
  phone: string;
  crop: string;
};

export default function ExpoEventOrderPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");

  const [farmer, setFarmer] = useState<FarmerMe | null>(null);

  const [eventInfo, setEventInfo] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [isAgriManager, setIsAgriManager] = useState(false);
  const [agriManagerNo, setAgriManagerNo] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFarmer() {
      try {
        const res = await fetch("/api/farmer/me", { cache: "no-store" });
        const json = await res.json();

        if (res.ok && json?.success && json?.item) {
          setFarmer(json.item);
          setReceiverName(json.item.name || "");
          setReceiverPhone(formatKoreanPhone(json.item.phone || ""));
          setDepositorName(json.item.name || "");
        }
      } catch {}
    }

    loadFarmer();
  }, []);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/expo/events/${eventId}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "이벤트 정보를 불러오지 못했습니다.");
        }

        setEventInfo(json.item || null);
      } catch (error: any) {
        setMessage(error?.message || "이벤트 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingEvent(false);
      }
    }

    if (eventId) loadEvent();
  }, [eventId]);

  const totalAmount = useMemo(() => {
    return Number(eventInfo?.expo_price_krw || 0) * Number(quantity || 0);
  }, [eventInfo, quantity]);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/expo/events/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          quantity,
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          zipcode,
          address1,
          address2,
          is_agri_manager: isAgriManager,
          agri_manager_no: agriManagerNo,
          depositor_name: depositorName,
          note,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "주문 생성에 실패했습니다.");
      }

      alert(
        `주문이 접수되었습니다.\n주문번호: ${json.item.order_id}\n총 결제금액: ${fmtKrw(
          json.item.total_amount_krw
        )}`
      );

      router.replace("/expo");
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || "주문 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEvent) {
    return <main className="mx-auto max-w-3xl px-4 py-10">불러오는 중...</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-black text-emerald-700">EXPO EVENT ORDER</div>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          {eventInfo?.title || "공동이벤트 주문"}
        </h1>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="text-lg font-black text-slate-900">
            {eventInfo?.product_name || "-"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            정상가 {fmtKrw(eventInfo?.normal_price_krw)} → 엑스포가{" "}
            <span className="font-black text-rose-600">
              {fmtKrw(eventInfo?.expo_price_krw)}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            남은 수량:{" "}
            {Math.max(
              0,
              Number(eventInfo?.total_quantity || 0) -
                Number(eventInfo?.sold_quantity || 0) -
                Number(eventInfo?.reserved_quantity || 0)
            )}
          </div>
        </div>

        <form onSubmit={submitOrder} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-black">받는 분</div>
              <input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-black">연락처</div>
              <input
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(formatKoreanPhone(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-black">수량</div>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value || 1))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-black">입금자명</div>
              <input
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-black">우편번호</div>
              <input
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-black">
                <input
                  type="checkbox"
                  checked={isAgriManager}
                  onChange={(e) => setIsAgriManager(e.target.checked)}
                />
                농업경영체
              </label>
            </div>
          </div>

          {isAgriManager ? (
            <label className="block">
              <div className="mb-2 text-sm font-black">
                농업경영체 등록번호/식별정보
              </div>
              <input
                value={agriManagerNo}
                onChange={(e) => setAgriManagerNo(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          ) : null}

          <label className="block">
            <div className="mb-2 text-sm font-black">주소</div>
            <input
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="기본 주소"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black">상세 주소</div>
            <input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="상세 주소"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black">요청사항</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">
            총 결제 예정 금액: {fmtKrw(totalAmount)}
          </div>

          {message ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-black text-white"
          >
            {submitting ? "주문 접수 중..." : "주문 접수하기"}
          </button>
        </form>
      </div>
    </main>
  );
}