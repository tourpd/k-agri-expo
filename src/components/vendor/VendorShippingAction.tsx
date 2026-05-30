"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  currentCompany?: string;
  currentTrackingNumber?: string;
};

export default function VendorShippingAction({
  orderId,
  currentCompany = "",
  currentTrackingNumber = "",
}: Props) {
  const [company, setCompany] = useState(
    currentCompany || "CJ대한통운"
  );

  const [trackingNumber, setTrackingNumber] =
    useState(currentTrackingNumber);

  const [working, setWorking] = useState(false);

  async function submit() {
    if (!trackingNumber.trim()) {
      alert("송장번호를 입력하세요.");
      return;
    }

    const ok = confirm(
      "배송중 처리하시겠습니까?"
    );

    if (!ok) {
      return;
    }

    setWorking(true);

    try {
      const res = await fetch(
        "/api/vendor/tracking-upload",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            rows: [
              {
                order_id: orderId,
                tracking_company: company,
                tracking_number:
                  trackingNumber,
              },
            ],
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.error || "처리 실패"
        );
        return;
      }

      alert("배송중 처리 완료");

      window.location.reload();
    } catch (e: any) {
      alert(
        e?.message ||
          "처리 중 오류 발생"
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex min-w-[240px] flex-col gap-2">
      <select
        value={company}
        onChange={(e) =>
          setCompany(e.target.value)
        }
        className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
      >
        <option value="CJ대한통운">
          CJ대한통운
        </option>

        <option value="롯데택배">
          롯데택배
        </option>

        <option value="한진택배">
          한진택배
        </option>

        <option value="우체국택배">
          우체국택배
        </option>

        <option value="로젠택배">
          로젠택배
        </option>
      </select>

      <input
        value={trackingNumber}
        onChange={(e) =>
          setTrackingNumber(
            e.target.value
          )
        }
        placeholder="송장번호 입력"
        className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
      />

      <button
        type="button"
        onClick={submit}
        disabled={working}
        className="rounded-2xl bg-green-700 px-4 py-3 font-black text-white disabled:opacity-60"
      >
        {working
          ? "처리중..."
          : "배송중 처리"}
      </button>
    </div>
  );
}