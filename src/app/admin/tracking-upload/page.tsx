"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ParsedRow = {
  order_id: string;
  tracking_company: string;
  tracking_number: string;
  shipped_at?: string;
  memo?: string;
  parse_error?: string;
};

type Result = {
  order_id: string;
  success: boolean;
  error?: string;
};

const DEFAULT_COMPANY = "CJ대한통운";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeHeader(v: string) {
  return clean(v).replace(/\s/g, "").toLowerCase();
}

function normalizeCompany(v: string) {
  const s = clean(v);
  const lower = s.toLowerCase();

  if (!s) return DEFAULT_COMPANY;
  if (lower.includes("cj") || s.includes("대한통운")) return "CJ대한통운";
  if (s.includes("롯데")) return "롯데택배";
  if (s.includes("한진")) return "한진택배";
  if (s.includes("우체국")) return "우체국택배";
  if (s.includes("로젠")) return "로젠택배";
  if (s.includes("경동")) return "경동택배";
  if (s.includes("대신")) return "대신택배";
  if (s.includes("천일")) return "천일택배";
  if (s.includes("합동")) return "합동택배";
  if (s.includes("건영")) return "건영택배";
  if (s.includes("쿠팡")) return "쿠팡로지스틱스";
  if (s.includes("직접")) return "직접배송";
  if (s.includes("화물")) return s;

  return s;
}

function looksLikeCompany(v: unknown) {
  const s = clean(v);
  const c = normalizeCompany(s);

  return (
    c.includes("대한통운") ||
    c.includes("롯데") ||
    c.includes("한진") ||
    c.includes("우체국") ||
    c.includes("로젠") ||
    c.includes("경동") ||
    c.includes("대신") ||
    c.includes("천일") ||
    c.includes("합동") ||
    c.includes("건영") ||
    c.includes("쿠팡") ||
    c.includes("직접") ||
    c.includes("화물")
  );
}

function splitExcelLine(line: string) {
  const s = clean(line);

  if (s.includes("\t")) return s.split("\t").map(clean);
  if (s.includes("|")) return s.split("|").map(clean);
  if (s.includes(" / ")) return s.split(" / ").map(clean);
  if (s.includes(",")) return s.split(",").map(clean);
  if (/\s{2,}/.test(s)) return s.split(/\s{2,}/).map(clean);

  return s.split(/\s+/).map(clean);
}

function findHeaderIndex(headers: string[], names: string[], fallback = -1) {
  const normalized = headers.map(normalizeHeader);
  const targets = names.map(normalizeHeader);
  const idx = normalized.findIndex((v) => targets.includes(v));

  return idx >= 0 ? idx : fallback;
}

function isValidTrackingNumber(v: unknown) {
  const s = clean(v);
  return /^[0-9A-Za-z\-]{5,40}$/.test(s);
}

function parseText(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());

  if (lines.length === 0) return [];

  const firstCols = splitExcelLine(lines[0]);

  const hasHeader =
    firstCols.some((v) => normalizeHeader(v) === "주문id") ||
    firstCols.some((v) => normalizeHeader(v) === "택배사") ||
    firstCols.some((v) => normalizeHeader(v) === "배송사") ||
    firstCols.some((v) => normalizeHeader(v) === "송장번호") ||
    firstCols.some((v) => normalizeHeader(v) === "운송장번호");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  let orderIdIndex = 0;
  let companyIndex = -1;
  let trackingIndex = -1;
  let shippedAtIndex = -1;
  let memoIndex = -1;

  if (hasHeader) {
    orderIdIndex = findHeaderIndex(firstCols, ["주문ID", "주문번호", "order_id", "id"], 0);
    companyIndex = findHeaderIndex(firstCols, ["택배사", "배송사", "tracking_company", "delivery_company"], -1);
    trackingIndex = findHeaderIndex(firstCols, ["송장번호", "운송장번호", "tracking_number"], -1);
    shippedAtIndex = findHeaderIndex(firstCols, ["출고일", "shipped_at"], -1);
    memoIndex = findHeaderIndex(firstCols, ["비고", "메모", "memo"], -1);
  }

  return dataLines
    .map((line) => {
      const cols = splitExcelLine(line);

      if (hasHeader) {
        if (orderIdIndex < 0 || trackingIndex < 0) {
          return {
            order_id: "",
            tracking_company: "",
            tracking_number: "",
            shipped_at: "",
            memo: "",
            parse_error: "헤더에 주문ID 또는 송장번호가 없습니다.",
          };
        }

        return {
          order_id: clean(cols[orderIdIndex]),
          tracking_company: normalizeCompany(companyIndex >= 0 ? cols[companyIndex] : DEFAULT_COMPANY),
          tracking_number: clean(cols[trackingIndex]),
          shipped_at: shippedAtIndex >= 0 ? clean(cols[shippedAtIndex]) : "",
          memo: memoIndex >= 0 ? clean(cols[memoIndex]) : "",
        };
      }

      if (cols.length === 2) {
        return {
          order_id: clean(cols[0]),
          tracking_company: DEFAULT_COMPANY,
          tracking_number: clean(cols[1]),
          shipped_at: "",
          memo: "",
        };
      }

      if (cols.length === 3) {
        return {
          order_id: clean(cols[0]),
          tracking_company: normalizeCompany(cols[1]),
          tracking_number: clean(cols[2]),
          shipped_at: "",
          memo: "",
        };
      }

      if (cols.length === 4) {
        return {
          order_id: clean(cols[0]),
          tracking_company: normalizeCompany(cols[1]),
          tracking_number: clean(cols[2]),
          shipped_at: clean(cols[3]),
          memo: "",
        };
      }

      if (cols.length === 5) {
        return {
          order_id: clean(cols[0]),
          tracking_company: normalizeCompany(cols[1]),
          tracking_number: clean(cols[2]),
          shipped_at: clean(cols[3]),
          memo: clean(cols[4]),
        };
      }

      if (cols.length >= 10) {
        const carrierIndex = cols.findIndex((v) => looksLikeCompany(v));

        const reversedTrackingIndex = [...cols]
          .reverse()
          .findIndex((v) => isValidTrackingNumber(v));

        const realTrackingIndex =
          reversedTrackingIndex >= 0 ? cols.length - 1 - reversedTrackingIndex : -1;

        return {
          order_id: clean(cols[0]),
          tracking_company:
            carrierIndex >= 0 ? normalizeCompany(cols[carrierIndex]) : DEFAULT_COMPANY,
          tracking_number: realTrackingIndex >= 0 ? clean(cols[realTrackingIndex]) : "",
          shipped_at: "",
          memo: "",
        };
      }

      return {
        order_id: clean(cols[0]),
        tracking_company: "",
        tracking_number: "",
        shipped_at: "",
        memo: "",
        parse_error: "컬럼 수가 맞지 않습니다. 주문ID|택배사|송장번호 형식으로 입력하세요.",
      };
    })
    .filter((row) => {
      const id = normalizeHeader(row.order_id);

      if (!row.order_id && !row.parse_error) return false;
      if (id === "주문id" || id === "주문번호" || id === "order_id" || id === "id") return false;

      return true;
    });
}

function hasProblem(row: ParsedRow) {
  if (row.parse_error) return row.parse_error;
  if (!row.order_id) return "주문ID 없음";
  if (row.order_id.length < 10) return "주문ID 형식 의심";
  if (!row.tracking_company) return "택배사 없음";
  if (!row.tracking_number) return "송장번호 없음";

  if (!isValidTrackingNumber(row.tracking_number)) {
    return "송장번호는 숫자/영문/하이픈 5~40자리만 허용";
  }

  return "";
}

export default function TrackingUploadPage() {
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const rows = useMemo(() => parseText(text), [text]);
  const validRows = rows.filter((row) => !hasProblem(row));
  const problemRows = rows.filter((row) => hasProblem(row));

  async function upload() {
    if (rows.length === 0) {
      alert("붙여넣은 송장 데이터가 없습니다.");
      return;
    }

    if (validRows.length === 0) {
      alert("등록 가능한 송장 데이터가 없습니다.");
      return;
    }

    const ok =
      problemRows.length > 0
        ? confirm(`문제 있는 행 ${problemRows.length}건은 제외하고 ${validRows.length}건만 등록할까요?`)
        : confirm(`${validRows.length}건 송장을 등록할까요?`);

    if (!ok) return;

    setWorking(true);

    try {
      const res = await fetch("/api/admin/product-orders/tracking-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json().catch(() => null);

      setWorking(false);

      if (!data?.success) {
        alert(data?.error || "송장 업로드 실패");
        return;
      }

      setResults(data.results || []);
      alert(`성공 ${data.success_count}건 / 실패 ${data.fail_count}건`);
    } catch {
      setWorking(false);
      alert("서버 업로드 중 오류 발생");
    }
  }

  function clearAll() {
    setText("");
    setResults([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-black text-green-700">K-AGRI OMS</p>

        <h1 className="mt-2 text-4xl font-black">전관 제품 주문 송장 업로드</h1>

        <p className="mt-3 text-lg font-bold text-slate-600">
          OMS 전체 엑셀 또는 주문ID / 택배사 / 송장번호 형식을 자동 인식합니다.
        </p>

        <Link
          href="/admin/product-orders"
          className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-base font-black text-white"
        >
          주문 운영센터로 돌아가기
        </Link>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="전체 인식" value={`${rows.length}건`} />
        <StatCard label="등록 가능" value={`${validRows.length}건`} green />
        <StatCard label="문제 행" value={`${problemRows.length}건`} red />
        <StatCard label="처리 결과" value={`${results.length}건`} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">1. 송장 데이터 붙여넣기</h2>

            <p className="mt-2 text-base font-bold text-slate-600">
              엑셀 전체, 탭, 파이프(|), 콤마, 슬래시, 공백 구분 입력을 자동 인식합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-2xl bg-slate-200 px-5 py-3 text-base font-black text-slate-900"
          >
            초기화
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-base font-black leading-8 text-yellow-800">
          허용 양식 1<br />
          주문ID|택배사|송장번호<br /><br />
          허용 양식 2<br />
          주문ID / 브랜드 / 제품명 / 농민명 / 연락처 / 주소 / 작물 / 재배평수 / 주문수량 / 택배사 / 송장번호 / 출고일 / 비고<br /><br />
          택배사 칸이 없어도 맨 뒤쪽 숫자 송장번호를 자동으로 잡습니다.
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`218b26c6-8bbc-435c-ae31-d5ba8cee0287 2026-05-12T15:52:16.434+00:00 도프 독수리 5형제 시리즈 아미 65 김아미 010-9876-7676 10364 경기 고양시 일산동구 호수로 672 123 마늘 6000 1 입금완료 출고준비 1234567890`}
          className="mt-5 min-h-[300px] w-full rounded-2xl border-2 border-slate-300 p-5 text-lg font-bold leading-8 outline-none focus:border-green-700"
        />

        <div className="mt-5 rounded-2xl bg-green-50 p-5 text-xl font-black text-green-800 ring-1 ring-green-200">
          등록 가능 송장: {validRows.length}건
        </div>

        {problemRows.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-5 text-base font-bold text-red-700 ring-1 ring-red-200">
            문제 있는 행 {problemRows.length}건이 있습니다. 아래 미리보기에서 확인하세요.
          </div>
        ) : null}

        <button
          type="button"
          onClick={upload}
          disabled={working}
          className="mt-5 w-full rounded-3xl bg-green-700 py-6 text-2xl font-black text-white disabled:opacity-60"
        >
          {working ? "등록 중..." : "송장 일괄 등록"}
        </button>
      </section>

      {rows.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">2. 업로드 전 미리보기</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-4">상태</th>
                  <th className="p-4">주문ID</th>
                  <th className="p-4">택배사</th>
                  <th className="p-4">송장번호</th>
                  <th className="p-4">출고일</th>
                  <th className="p-4">비고</th>
                  <th className="p-4">문제</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, i) => {
                  const problem = hasProblem(row);

                  return (
                    <tr key={`${row.order_id}-${i}`} className="border-b">
                      <td className="p-4 font-black">
                        {problem ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">제외</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">가능</span>
                        )}
                      </td>

                      <td className="p-4 font-bold">{row.order_id || "-"}</td>
                      <td className="p-4 font-bold">{row.tracking_company || "-"}</td>
                      <td className="p-4 font-bold">{row.tracking_number || "-"}</td>
                      <td className="p-4 font-bold">{row.shipped_at || "-"}</td>
                      <td className="p-4 font-bold">{row.memo || "-"}</td>
                      <td className="p-4 font-bold text-red-600">{problem || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">3. 처리 결과</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-4">주문ID</th>
                  <th className="p-4">결과</th>
                  <th className="p-4">메시지</th>
                </tr>
              </thead>

              <tbody>
                {results.map((r, i) => (
                  <tr key={`${r.order_id}-${i}`} className="border-b">
                    <td className="p-4 font-bold">{r.order_id}</td>
                    <td className="p-4 font-black">
                      {r.success ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">성공</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">실패</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-600">{r.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            href="/admin/product-orders"
            className="mt-6 inline-flex w-full justify-center rounded-3xl bg-slate-900 py-5 text-xl font-black text-white"
          >
            주문 운영센터에서 배송중 확인하기
          </Link>
        </section>
      ) : null}
    </main>
  );
}

function StatCard({
  label,
  value,
  green = false,
  red = false,
}: {
  label: string;
  value: string;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-sm ${
        red
          ? "bg-red-600 text-white"
          : green
            ? "bg-green-700 text-white"
            : "bg-white text-slate-900"
      }`}
    >
      <p className="text-sm font-black opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}