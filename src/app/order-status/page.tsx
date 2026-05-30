"use client";

import { useMemo, useState } from "react";

type Order = {
  id: string;
  created_at: string | null;
  product_name: string;
  brand_name: string;
  farmer_name: string;
  phone: string;
  address: string;
  crop: string;
  farm_size: string;
  quantity: string;
  status: string;
  payment_status?: string;
  tracking_company: string;
  tracking_number: string;
  tracking_url?: string;
  shipped_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";

  return String(v)
    .replace("T", " ")
    .slice(0, 16);
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length < 4) {
    return numbers;
  }

  if (numbers.length < 8) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(
    3,
    7
  )}-${numbers.slice(7)}`;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function statusColor(status: string) {
  if (status === "입금대기") {
    return "bg-yellow-100 text-yellow-800";
  }

  if (
    status === "입금완료" ||
    status === "입금확인"
  ) {
    return "bg-green-100 text-green-800";
  }

  if (status === "출고준비") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "배송중") {
    return "bg-purple-100 text-purple-800";
  }

  if (status === "배송완료") {
    return "bg-slate-900 text-white";
  }

  return "bg-red-100 text-red-700";
}

function makeTrackingUrl(
  company?: string,
  number?: string,
  fallbackUrl?: string
) {
  const c = safe(company);
  const n = safe(number);

  if (fallbackUrl) {
    return fallbackUrl;
  }

  if (!n) {
    return "";
  }

  if (
    c.includes("CJ") ||
    c.includes("대한통운")
  ) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("롯데")) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("한진")) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblNum=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("우체국")) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(
      n
    )}`;
  }

  if (c.includes("로젠")) {
    return `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(
      n
    )}`;
  }

  return "";
}

function openTracking(order: Order) {
  const url = makeTrackingUrl(
    order.tracking_company,
    order.tracking_number,
    order.tracking_url
  );

  if (!url) {
    alert(
      "아직 자동 배송조회 링크를 지원하지 않는 택배사입니다."
    );
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function OrderStatusPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return (
        new Date(
          b.created_at || ""
        ).getTime() -
        new Date(
          a.created_at || ""
        ).getTime()
      );
    });
  }, [orders]);

  async function searchOrders() {
    setMessage("");
    setOrders([]);

    const normalizedName = safe(name);
    const normalizedPhone =
      normalizePhone(phone);

    if (
      !normalizedName ||
      !normalizedPhone
    ) {
      setMessage(
        "성함과 연락처를 입력해 주세요."
      );

      return;
    }

    if (normalizedPhone.length < 10) {
      setMessage(
        "연락처를 정확히 입력해 주세요."
      );

      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/order-status",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            phone: normalizedPhone,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      setLoading(false);

      if (!data?.success) {
        setMessage(
          data?.error ||
            "주문 조회에 실패했습니다."
        );

        return;
      }

      if (
        !Array.isArray(data.orders) ||
        data.orders.length === 0
      ) {
        setMessage(
          "조회되는 주문이 없습니다. 이름과 연락처를 다시 확인해 주세요."
        );

        return;
      }

      setOrders(data.orders);
    } catch (e: any) {
      setLoading(false);

      setMessage(
        e?.message ||
          "주문 조회 중 오류가 발생했습니다."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl bg-green-800 p-8 text-white shadow-sm">
        <p className="text-sm font-black text-yellow-200">
          K-Agri Expo
        </p>

        <h1 className="mt-2 text-4xl font-black">
          주문 · 배송조회
        </h1>

        <p className="mt-3 text-lg font-bold text-green-50">
          성함과 연락처를 입력하면
          주문 상태와 배송정보를
          확인할 수 있습니다.
        </p>
      </section>

      <section className="mx-auto mt-5 max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-lg font-black">
            성함
          </span>

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="예: 홍길동"
            className="w-full rounded-2xl border border-slate-300 px-5 py-5 text-xl font-bold outline-none focus:border-green-700"
          />
        </label>

        <label className="mt-5 block">
          <span className="mb-2 block text-lg font-black">
            연락처
          </span>

          <input
            value={phone}
            onChange={(e) =>
              setPhone(
                formatPhone(
                  e.target.value
                )
              )
            }
            inputMode="numeric"
            placeholder="예: 010-1234-5678"
            className="w-full rounded-2xl border border-slate-300 px-5 py-5 text-xl font-bold outline-none focus:border-green-700"
          />
        </label>

        <button
          type="button"
          onClick={searchOrders}
          disabled={loading}
          className="mt-6 w-full rounded-3xl bg-green-700 py-6 text-2xl font-black text-white disabled:opacity-60"
        >
          {loading
            ? "조회 중..."
            : "주문 조회하기"}
        </button>

        {message ? (
          <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-lg font-black text-yellow-800">
            {message}
          </div>
        ) : null}
      </section>

      {sortedOrders.length > 0 ? (
        <section className="mx-auto mt-5 grid max-w-3xl gap-4">
          {sortedOrders.map((order) => {
            const status =
              order.status ||
              order.payment_status ||
              "-";

            return (
              <article
                key={order.id}
                className="rounded-3xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      주문번호
                    </p>

                    <p className="mt-1 break-all text-base font-black text-slate-800">
                      {order.id}
                    </p>

                    <p className="mt-3 text-sm font-bold text-slate-500">
                      주문일{" "}
                      {shortDate(
                        order.created_at
                      )}
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {order.product_name}
                    </h2>

                    <p className="mt-1 text-base font-bold text-slate-500">
                      {order.brand_name ||
                        "K-Agri Expo"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-base font-black ${statusColor(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-5 text-lg font-bold">
                  <p>
                    주문자:{" "}
                    {order.farmer_name}
                  </p>

                  <p>
                    연락처: {order.phone}
                  </p>

                  <p>
                    작물:{" "}
                    {order.crop || "-"}
                  </p>

                  <p>
                    재배평수:{" "}
                    {order.farm_size
                      ? `${order.farm_size}평`
                      : "-"}
                  </p>

                  <p>
                    수량:{" "}
                    {order.quantity ||
                      "-"}
                    개
                  </p>

                  <p>
                    주소:{" "}
                    {order.address ||
                      "-"}
                  </p>
                </div>

                {order.tracking_number ? (
                  <div className="mt-5 rounded-2xl bg-purple-50 p-5 text-lg font-black text-purple-800">
                    <p>
                      택배사:{" "}
                      {order.tracking_company ||
                        "-"}
                    </p>

                    <p className="mt-2 break-all">
                      송장번호:{" "}
                      {
                        order.tracking_number
                      }
                    </p>

                    <p className="mt-2 text-base font-bold text-purple-700">
                      출고일:{" "}
                      {shortDate(
                        order.shipped_at
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openTracking(
                          order
                        )
                      }
                      className="mt-5 w-full rounded-2xl bg-purple-700 py-5 text-xl font-black text-white"
                    >
                      배송추적 바로가기
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-lg font-bold text-slate-600">
                    아직 송장번호가
                    등록되지 않았습니다.
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}