"use client";

import { useEffect, useState } from "react";

type MatchItem = {
  id: string;
  vendor_id?: string | null;
  booth_id?: string | null;
  match_score?: number | null;
  reasoning?: string | null;
  match_status?: string | null;
  vendor_name?: string | null;
  vendor_contact_name?: string | null;
  vendor_contact_phone?: string | null;
  vendor_contact_email?: string | null;
  booth_name?: string | null;
};

type ActivityItem = {
  id: string;
  activity_type?: string | null;
  counterparty_type?: string | null;
  counterparty_name?: string | null;
  summary?: string | null;
  detail?: string | null;
  next_action_at?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function NegotiationPanel({
  leadId,
  onChanged,
}: {
  leadId: string;
  onChanged?: () => void;
}) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activityType, setActivityType] = useState("call");
  const [counterpartyType, setCounterpartyType] = useState("vendor");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyPhone, setCounterpartyPhone] = useState("");
  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const [mRes, lRes] = await Promise.all([
        fetch(`/api/admin/leads/${leadId}/matches`, { cache: "no-store" }),
        fetch(`/api/admin/leads/${leadId}/activity`, { cache: "no-store" }),
      ]);

      const mJson = await mRes.json();
      const lJson = await lRes.json();

      if (!mRes.ok || !mJson.ok) {
        throw new Error(mJson.error || "추천 업체 조회 실패");
      }

      if (!lRes.ok || !lJson.ok) {
        throw new Error(lJson.error || "활동 로그 조회 실패");
      }

      setMatches(mJson.items || []);
      setLogs(lJson.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!leadId) return;
    fetchData();
  }, [leadId]);

  async function assignVendor(item: MatchItem) {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/assign-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: item.id,
          vendor_id: item.vendor_id,
          booth_id: item.booth_id,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "업체 배정 실패");
      }

      setNotice("추천 업체를 협상 대상 업체로 배정했습니다.");
      await fetchData();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업체 배정 실패");
    } finally {
      setSaving(false);
    }
  }

  async function saveActivity() {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_type: activityType,
          counterparty_type: counterpartyType,
          counterparty_name: counterpartyName,
          counterparty_phone: counterpartyPhone,
          counterparty_email: counterpartyEmail,
          summary,
          detail,
          next_action_at: nextActionAt || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "활동 로그 저장 실패");
      }

      setNotice("협상/통화 기록이 저장되었습니다.");
      setSummary("");
      setDetail("");
      setNextActionAt("");
      await fetchData();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "활동 로그 저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {(notice || error) && (
        <div className="space-y-2">
          {notice ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      )}

      <section className="rounded-3xl border border-neutral-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">자동 추천 업체</div>
            <div className="mt-1 text-sm text-neutral-500">
              바이어 수요와 가장 맞는 업체 후보입니다. 직접 조율할 업체를 선택하십시오.
            </div>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              추천 업체가 없습니다. 매칭 엔진 결과가 아직 없거나 수동 매칭이 필요합니다.
            </div>
          ) : (
            matches.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">
                      {item.vendor_name || "업체명 없음"}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      부스: {item.booth_name || "-"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                      점수 {Number(item.match_score || 0)}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      상태 {item.match_status || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-neutral-700">
                  <div>담당자: {item.vendor_contact_name || "-"}</div>
                  <div>연락처: {item.vendor_contact_phone || "-"}</div>
                  <div>이메일: {item.vendor_contact_email || "-"}</div>
                  <div className="whitespace-pre-wrap">
                    추천 이유: {item.reasoning || "-"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => assignVendor(item)}
                    disabled={saving || !item.vendor_id}
                    className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    이 업체 배정
                  </button>

                  {item.vendor_contact_phone ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCounterpartyType("vendor");
                        setCounterpartyName(item.vendor_name || "");
                        setCounterpartyPhone(item.vendor_contact_phone || "");
                        setCounterpartyEmail(item.vendor_contact_email || "");
                        setActivityType("call");
                        setSummary("추천 업체와 1차 통화");
                        window.location.href = `tel:${item.vendor_contact_phone}`;
                      }}
                      className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold"
                    >
                      업체 전화
                    </button>
                  ) : null}

                  {item.vendor_contact_email ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCounterpartyType("vendor");
                        setCounterpartyName(item.vendor_name || "");
                        setCounterpartyPhone(item.vendor_contact_phone || "");
                        setCounterpartyEmail(item.vendor_contact_email || "");
                        setActivityType("email");
                        setSummary("추천 업체와 이메일 협의 시작");
                        window.location.href = `mailto:${item.vendor_contact_email}`;
                      }}
                      className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold"
                    >
                      업체 이메일
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 p-5">
        <div className="mb-4 text-lg font-semibold">협상 / 통화 기록</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-semibold">기록 종류</div>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
            >
              <option value="call">전화</option>
              <option value="email">이메일</option>
              <option value="meeting">미팅</option>
              <option value="note">내부메모</option>
              <option value="negotiation">가격협상</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">상대 구분</div>
            <select
              value={counterpartyType}
              onChange={(e) => setCounterpartyType(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
            >
              <option value="vendor">업체</option>
              <option value="buyer">바이어</option>
              <option value="internal">내부</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">상대 이름</div>
            <input
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
              placeholder="예: DOF 담당자 / ABC Trading John"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">상대 연락처</div>
            <input
              value={counterpartyPhone}
              onChange={(e) => setCounterpartyPhone(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
              placeholder="예: 010-1234-5678"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-semibold">상대 이메일</div>
            <input
              value={counterpartyEmail}
              onChange={(e) => setCounterpartyEmail(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
              placeholder="예: sales@company.com"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-semibold">한 줄 요약 *</div>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
              placeholder="예: 업체와 1차 통화, FOB 조건 가능 확인"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-semibold">상세 메모</div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
              placeholder="가격 범위, MOQ, 납기, 결제 조건, 수출 경험 등"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">다음 액션 시점</div>
            <input
              type="datetime-local"
              value={nextActionAt}
              onChange={(e) => setNextActionAt(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={saveActivity}
            disabled={saving || !summary.trim()}
            className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "협상 기록 저장"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 p-5">
        <div className="mb-4 text-lg font-semibold">최근 협상 로그</div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              저장된 협상 로그가 없습니다.
            </div>
          ) : (
            logs.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">
                    {item.summary || "-"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div className="mt-2 text-sm text-neutral-600">
                  상대: {item.counterparty_type || "-"} / {item.counterparty_name || "-"}
                </div>

                <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                  {item.detail || "-"}
                </div>

                <div className="mt-2 text-xs text-neutral-500">
                  다음 액션: {formatDate(item.next_action_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}