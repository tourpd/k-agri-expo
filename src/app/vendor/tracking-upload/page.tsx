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
  sms_logged?: boolean;
  sms_error?: string;
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

function splitExcelLine(line: string) {
  return line.split("\t").map((v) => clean(v));
}

function findHeaderIndex(headers: string[], names: string[]) {
  const normalized = headers.map(normalizeHeader);
  const targets = names.map(normalizeHeader);

  return normalized.findIndex((h) => targets.includes(h));
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
    firstCols.some((v) => normalizeHeader(v) === "송장번호") ||
    firstCols.some((v) => normalizeHeader(v) === "택배사");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  let orderIdIndex = 0;
  let companyIndex = 1;
  let trackingIndex = 2;
  let shippedAtIndex = 3;
  let memoIndex = 4;

  if (hasHeader) {
    orderIdIndex = findHeaderIndex(firstCols, ["주문ID", "주문번호", "order_id", "id"]);
    companyIndex = findHeaderIndex(firstCols, ["택배사", "배송사", "tracking_company", "delivery_company"]);
    trackingIndex = findHeaderIndex(firstCols, ["송장번호", "운송장번호", "tracking_number"]);
    shippedAtIndex = findHeaderIndex(firstCols, ["출고일", "shipped_at"]);
    memoIndex = findHeaderIndex(firstCols, ["비고", "메모", "memo"]);
  }

  return dataLines
    .map((line) => {
      const cols = splitExcelLine(line);

      if (cols.length >= 6 && !hasHeader) {
        return {
          order_id: clean(cols[0]),
          tracking_company: "",
          tracking_number: "",
          shipped_at: "",
          memo: "",
          parse_error: "송장 업로드는 주문ID / 택배사 / 송장번호 형식만 허용합니다.",
        };
      }

      if (hasHeader) {
        if (orderIdIndex < 0 || trackingIndex < 0) {
          return {
            order_id: "",
            tracking_company: "",
            tracking_number: "",
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

      return {
        order_id: clean(cols[0]),
        tracking_company: "",
        tracking_number: "",
        parse_error: "컬럼 수가 맞지 않습니다.",
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

export default function VendorTrackingUploadPage() {
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
      alert("등록 가능한 송장이 없습니다.");
      return;
    }

    const ok =
      problemRows.length > 0
        ? confirm(`문제 행 ${problemRows.length}건 제외 후 ${validRows.length}건 등록할까요?`)
        : confirm(`${validRows.length}건 송장을 등록할까요?`);

    if (!ok) return;

    setWorking(true);

    try {
      const res = await fetch("/api/vendor/tracking-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: validRows,
        }),
      });

      const data = await res.json().catch(() => null);

      setWorking(false);

      if (!data?.success) {
        alert(data?.error || "업로드 실패");
        return;
      }

      setResults(data.results || []);
      alert(`성공 ${data.success_count}건 / 실패 ${data.fail_count}건`);
    } catch {
      setWorking(false);
      alert("서버 연결 실패");
    }
  }

  function clearAll() {
    setText("");
    setResults([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-black text-green-700">VENDOR SHIPPING</p>

        <h1 className="mt-2 text-4xl font-black">업체 송장 업로드</h1>

        <p className="mt-3 text-lg font-bold text-slate-600">
          업체는 자기 브랜드 주문 송장만 등록할 수 있습니다.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/vendor/orders"
            className="rounded-2xl bg-slate-900 px-5 py-3 font-black text-white"
          >
            주문관리로 돌아가기
          </Link>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-2xl bg-slate-200 px-5 py-3 font-black text-slate-900"
          >
            초기화
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="전체 인식" value={`${rows.length}건`} />
        <StatCard label="등록 가능" value={`${validRows.length}건`} green />
        <StatCard label="문제 행" value={`${problemRows.length}건`} red />
        <StatCard label="처리 결과" value={`${results.length}건`} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black">송장 엑셀 붙여넣기</h2>

        <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-base font-black leading-8 text-yellow-800">
          권장 양식<br />
          주문ID / 택배사 / 송장번호<br /><br />
          허용 예시<br />
          CJ대한통운, 롯데택배, 한진택배, 우체국택배, 로젠택배, 경동택배, 대신택배, 천일택배, 직접배송, 화물배송 등
          <br /><br />
          송장번호는 숫자, 영문, 하이픈을 허용합니다.
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`주문ID\t택배사\t송장번호
13ee6d0a-2c1e-4218-85ec-aecab283e4b1\t경동택배\tKD-1234567890`}
          className="mt-5 min-h-[320px] w-full rounded-2xl border-2 border-slate-300 p-5 text-lg font-bold leading-8 outline-none focus:border-green-700"
        />

        <div className="mt-5 rounded-2xl bg-green-50 p-5 text-xl font-black text-green-700">
          등록 가능 송장 {validRows.length}건
        </div>

        {problemRows.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-5 font-bold text-red-700">
            문제 행 {problemRows.length}건 존재
          </div>
        ) : null}

        <button
          type="button"
          onClick={upload}
          disabled={working}
          className="mt-5 w-full rounded-3xl bg-green-700 py-6 text-2xl font-black text-white disabled:opacity-60"
        >
          {working ? "등록 중..." : `송장 ${validRows.length}건 등록`}
        </button>
      </section>

      {rows.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">업로드 미리보기</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-4">상태</th>
                  <th className="p-4">주문ID</th>
                  <th className="p-4">택배사</th>
                  <th className="p-4">송장번호</th>
                  <th className="p-4">출고일</th>
                  <th className="p-4">문제</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, i) => {
                  const problem = hasProblem(row);

                  return (
                    <tr key={`${row.order_id}-${i}`} className="border-b">
                      <td className="p-4">
                        {problem ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 font-black text-red-700">
                            제외
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 font-black text-green-700">
                            가능
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-bold">{row.order_id || "-"}</td>
                      <td className="p-4 font-bold">{row.tracking_company || "-"}</td>
                      <td className="p-4 font-bold">{row.tracking_number || "-"}</td>
                      <td className="p-4 font-bold">{row.shipped_at || "-"}</td>
                      <td className="p-4 font-bold text-red-700">{problem || "-"}</td>
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
          <h2 className="text-2xl font-black">처리 결과</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-4">주문ID</th>
                  <th className="p-4">결과</th>
                  <th className="p-4">문자</th>
                  <th className="p-4">메시지</th>
                </tr>
              </thead>

              <tbody>
                {results.map((r, i) => (
                  <tr key={`${r.order_id}-${i}`} className="border-b">
                    <td className="p-4 font-bold">{r.order_id}</td>

                    <td className="p-4">
                      {r.success ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 font-black text-green-700">
                          성공
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 font-black text-red-700">
                          실패
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-black">
                      {r.sms_logged ? (
                        <span className="text-green-700">문자대기 등록</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-slate-600">
                      {r.error || r.sms_error || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            href="/vendor/orders"
            className="mt-6 inline-flex w-full justify-center rounded-3xl bg-slate-900 py-5 text-xl font-black text-white"
          >
            주문관리로 돌아가기
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