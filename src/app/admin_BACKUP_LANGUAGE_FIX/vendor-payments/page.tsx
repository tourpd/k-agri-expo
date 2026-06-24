"use client";

import { useState } from "react";
import Link from "next/link";

type Candidate = {
  application_id?: string;
  application_code?: string;
  company_name?: string;
  contact_name?: string;
  contact_phone?: string;
  amount_krw?: number;
  payment_status?: string;
  created_at?: string;
  score?: number;
  reason?: string;
};

type MatchItem = {
  depositor_name?: string;
  deposit_amount?: number;
  deposit_date?: string;
  memo?: string;
  matched?: boolean;
  reason?: string;
  candidates?: Candidate[];
};

type ExcelRow = Record<string, unknown>;

function money(v?: number | null) {
  const n = Number(v || 0);
  return n ? `${n.toLocaleString("ko-KR")}원` : "-";
}

function date(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("ko-KR");
}

export default function VendorPaymentsPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [items, setItems] = useState<MatchItem[]>([]);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");

  const confirmedCount = items.filter((x) => x.matched).length;
  const waitingCount = items.filter((x) => !x.matched).length;

  async function runExcelRead() {
    if (!excelFile) {
      setErrorNotice("엑셀 파일을 먼저 선택하세요.");
      return;
    }

    setLoading(true);
    setNotice("");
    setErrorNotice("");
    setItems([]);

    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const res = await fetch("/api/admin/vendor-payments/match-excel", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error || "엑셀 매칭 실패");

      setExcelRows(json.rows || []);
      setItems(json.items || []);
      setNotice(`엑셀 매칭 완료: ${json.items?.length || 0}건`);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "엑셀 매칭 실패");
    } finally {
      setLoading(false);
    }
  }

  async function manualConfirm(itemIndex: number, candidate: Candidate) {
    if (!candidate.application_id) {
      setErrorNotice("입금확정할 신청 ID가 없습니다.");
      return;
    }

    const target = items[itemIndex];

    setConfirmingId(candidate.application_id);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/vendor-payments/manual-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: candidate.application_id,
          deposit_amount: target.deposit_amount,
          depositor_name: target.depositor_name,
          raw_text: JSON.stringify(target),
        }),
      });

      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error || "입금확정 실패");

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === itemIndex
            ? {
                ...item,
                matched: true,
                reason: "입금확정 완료",
                candidates: [candidate],
              }
            : item
        )
      );

      setNotice("입금확정 처리되었습니다.");
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "입금확정 실패");
    } finally {
      setConfirmingId("");
    }
  }

  function resetAll() {
    setExcelFile(null);
    setExcelRows([]);
    setItems([]);
    setNotice("");
    setErrorNotice("");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 text-black md:p-5">
      <section className="mb-3 border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI PAYMENT ADMIN
            </div>
            <h1 className="mt-1 text-3xl font-black">입금 확인센터</h1>
            <p className="mt-2 text-sm font-bold text-neutral-700">
              엑셀을 올리고 추천업체가 맞으면 입금확정만 누르세요.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/vendor-applications"
              className="border bg-white px-4 py-2 text-sm font-black text-black"
            >
              승인센터로
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border bg-white px-4 py-2 text-sm font-black"
            >
              새로고침
            </button>
          </div>
        </div>
      </section>

      <section className="mb-3 grid gap-2 md:grid-cols-3">
        <Stat title="전체 입금" value={`${items.length}건`} />
        <Stat title="입금확정" value={`${confirmedCount}건`} tone="green" />
        <Stat title="확인대기" value={`${waitingCount}건`} tone="amber" />
      </section>

      {(notice || errorNotice) && (
        <section className="mb-3">
          {notice ? (
            <div className="border border-green-300 bg-green-50 p-3 font-black text-green-700">
              {notice}
            </div>
          ) : null}
          {errorNotice ? (
            <div className="border border-red-300 bg-red-50 p-3 font-black text-red-700">
              {errorNotice}
            </div>
          ) : null}
        </section>
      )}

      <section className="mb-3 border bg-white p-4">
        <h2 className="mb-3 text-xl font-black">1. 입금내역 엑셀 업로드</h2>

        <div className="grid gap-2 md:grid-cols-[1fr_160px_120px]">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            className="border bg-white px-3 py-2 text-sm font-black text-black"
          />

          <button
            type="button"
            onClick={runExcelRead}
            disabled={loading || !excelFile}
            className="bg-blue-700 px-5 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            {loading ? "읽는 중" : "엑셀 매칭"}
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="border bg-white px-5 py-2 text-sm font-black"
          >
            초기화
          </button>
        </div>

        {excelRows.length > 0 ? (
          <div className="mt-3 border bg-green-50 p-3 text-sm font-black text-green-700">
            엑셀 읽기 완료: {excelRows.length}행
          </div>
        ) : null}
      </section>

      <section className="border bg-white p-4">
        <h2 className="mb-3 text-xl font-black">2. 입금확정 처리</h2>

        {items.length === 0 ? (
          <div className="border bg-neutral-50 p-10 text-center font-black text-neutral-600">
            아직 입금내역이 없습니다. 엑셀을 먼저 업로드하세요.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const best = item.candidates?.[0];
              const others = item.candidates?.slice(1, 3) || [];

              return (
                <div
                  key={`payment-${idx}`}
                  className={`border p-4 ${
                    item.matched ? "bg-green-50" : "bg-white"
                  }`}
                >
                  <div className="grid gap-3 lg:grid-cols-[260px_1fr_180px]">
                    <div className="border bg-neutral-50 p-3">
                      <div className="text-xs font-black text-neutral-500">
                        입금내역
                      </div>
                      <div className="mt-2 text-2xl font-black">
                        {item.depositor_name || "-"}
                      </div>
                      <div className="mt-1 text-2xl font-black text-blue-700">
                        {money(item.deposit_amount)}
                      </div>
                      <div className="mt-2 text-xs font-bold text-neutral-600">
                        {item.deposit_date ? `입금일: ${date(item.deposit_date)}` : ""}
                      </div>
                      <div className="text-xs font-bold text-neutral-600">
                        {item.memo || ""}
                      </div>
                    </div>

                    <div className="border bg-white p-3">
                      <div className="text-xs font-black text-neutral-500">
                        추천업체
                      </div>

                      {best ? (
                        <div className="mt-2">
                          <div className="text-2xl font-black text-black">
                            {best.company_name || "-"}
                          </div>
                          <div className="mt-2 grid gap-2 text-sm font-bold md:grid-cols-4">
                            <Info label="담당자" value={best.contact_name || "-"} />
                            <Info label="전화" value={best.contact_phone || "-"} />
                            <Info label="신청금액" value={money(best.amount_krw)} />
                            <Info label="신청번호" value={best.application_code || "-"} />
                          </div>
                          <div className="mt-2 text-xs font-bold text-neutral-600">
                            추천사유: {best.reason || "-"}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-lg font-black text-red-700">
                          추천업체 없음
                        </div>
                      )}

                      {others.length > 0 && !item.matched ? (
                        <div className="mt-4 border-t pt-3">
                          <div className="mb-2 text-xs font-black text-neutral-500">
                            다른 후보
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {others.map((c) => (
                              <button
                                key={c.application_id}
                                type="button"
                                onClick={() => manualConfirm(idx, c)}
                                disabled={confirmingId === c.application_id}
                                className="border bg-white px-3 py-2 text-xs font-black text-black"
                              >
                                {c.company_name} / {money(c.amount_krw)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center border bg-neutral-50 p-3">
                      {item.matched ? (
                        <div className="text-center">
                          <div className="text-2xl font-black text-green-700">
                            입금확정 완료
                          </div>
                          <div className="mt-2 text-xs font-bold text-neutral-600">
                            승인센터에서 확인하세요.
                          </div>
                        </div>
                      ) : best ? (
                        <button
                          type="button"
                          onClick={() => manualConfirm(idx, best)}
                          disabled={confirmingId === best.application_id}
                          className="w-full bg-green-700 px-5 py-4 text-xl font-black text-white disabled:opacity-40"
                        >
                          {confirmingId === best.application_id
                            ? "처리중"
                            : "입금확정"}
                        </button>
                      ) : (
                        <Link
                          href="/admin/vendor-applications"
                          className="w-full border bg-white px-5 py-4 text-center text-sm font-black text-black"
                        >
                          승인센터에서 직접 찾기
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-neutral-50 p-2">
      <div className="text-xs font-black text-neutral-500">{label}</div>
      <div className="mt-1 font-black text-black">{value}</div>
    </div>
  );
}

function Stat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "green" | "amber";
}) {
  const cls =
    tone === "green"
      ? "border-green-300 bg-green-50 text-green-700"
      : tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-700"
      : "border-neutral-300 bg-white text-black";

  return (
    <div className={`border p-4 ${cls}`}>
      <div className="text-sm font-black">{title}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}