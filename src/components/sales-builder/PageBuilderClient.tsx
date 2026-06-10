"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CardType =
  | "problem"
  | "reason"
  | "solution"
  | "compare"
  | "usage"
  | "warning"
  | "comic"
  | "cta";

type DetailCard = {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  content: string;
  buttonText?: string;
  bg: string;
};

type LastChange = {
  cardTitle?: string;
  field?: string;
  before?: string;
  after?: string;
};

const initialCards: DetailCard[] = [
  {
    id: "problem",
    type: "problem",
    title: "옆집은 멀쩡한데, 우리 밭만 왜 이래?",
    subtitle: "농민이 바로 공감하는 첫 문제",
    content:
      "잎이 이상하고, 비료를 줘도 작물이 힘이 없고, 병인지 영양문제인지 헷갈리는 상황을 크게 보여줍니다.",
    bg: "bg-red-100",
  },
  {
    id: "reason",
    type: "reason",
    title: "문제는 원인을 알아야 풀립니다",
    subtitle: "이성준 회장형 신뢰 카드",
    content:
      "무조건 약부터 치는 것이 아니라 병해, 뿌리, 영양, 토양 상태를 구분해야 한다는 메시지를 넣습니다.",
    bg: "bg-yellow-100",
  },
  {
    id: "solution",
    type: "solution",
    title: "이 제품은 어떤 문제를 해결하는가?",
    subtitle: "제품 핵심 해결점",
    content:
      "제품명, 핵심 성분, 작물별 장점, 사용 시기를 농민이 이해하기 쉬운 말로 정리합니다.",
    bg: "bg-green-100",
  },
  {
    id: "compare",
    type: "compare",
    title: "사용 전 / 사용 후",
    subtitle: "비포애프터 이미지 자리",
    content:
      "제품을 쓰기 전 문제 장면과 사용 후 기대 장면을 한눈에 비교하는 이미지 블록입니다.",
    bg: "bg-blue-100",
  },
  {
    id: "usage",
    type: "usage",
    title: "작물별 사용법",
    subtitle: "고추 · 마늘 · 딸기 · 오이",
    content:
      "작물별 사용량, 희석배수, 사용시기, 반복횟수를 표처럼 쉽게 정리합니다.",
    bg: "bg-white",
  },
  {
    id: "warning",
    type: "warning",
    title: "주의사항",
    subtitle: "혼용 · 희석 · 보관",
    content:
      "혼용 가능 여부, 고온기 사용 주의, 보관 방법, 사용 전 확인사항을 별도 카드로 분리합니다.",
    bg: "bg-orange-100",
  },
  {
    id: "comic",
    type: "comic",
    title: "4컷 만화형 광고",
    subtitle: "박씨 · 영희 · 이장님 · 몽몽이",
    content:
      "1컷: 아이고 또 망했네 / 2컷: 옆집은 멀쩡한디? / 3컷: 문제는 원인이여 / 4컷: 그럼 나도 끼워줘유!",
    bg: "bg-purple-100",
  },
  {
    id: "cta",
    type: "cta",
    title: "오늘까지여~",
    subtitle: "공동구매 신청",
    content:
      "공동구매 마감, 가격 혜택, 신청 버튼을 크게 배치합니다. 이 버튼은 기존 주문·택배 시스템으로 연결됩니다.",
    buttonText: "공동구매 신청하기",
    bg: "bg-black",
  },
];

export default function PageBuilderClient({ projectId }: { projectId: string }) {
  const [cards, setCards] = useState<DetailCard[]>(initialCards);
  const [selectedId, setSelectedId] = useState(cards[0].id);
  const [projectName, setProjectName] = useState(`${projectId} 상세페이지`);
  const [saveStatus, setSaveStatus] = useState("저장 전");
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("아직 대화가 없습니다.");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadSavedBuilder() {
      try {
        setLoadingSaved(true);
        const res = await fetch(`/api/ai-sales/projects/${projectId}/builder`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data?.success && data?.data?.cards?.length) {
          setCards(data.data.cards);
          setSelectedId(data.data.cards[0].id);
          setProjectName(data.data.projectName || `${projectId} 상세페이지`);
          setLastChange(data.data.lastChange || null);
          setLastSavedAt(data.data.updatedAt || "");
          setSaveStatus("저장된 빌더 불러오기 완료");
        } else {
          setSaveStatus("저장된 빌더 없음");
        }
      } catch (error) {
        console.error(error);
        setSaveStatus("불러오기 실패");
      } finally {
        setLoadingSaved(false);
      }
    }

    loadSavedBuilder();
  }, [projectId]);

  const selected = cards.find((card) => card.id === selectedId) || cards[0];

  function updateSelected(patch: Partial<DetailCard>) {
    const current = cards.find((card) => card.id === selectedId);

    if (current) {
      const field = Object.keys(patch)[0] as keyof DetailCard | undefined;
      if (field) {
        setLastChange({
          cardTitle: current.title,
          field: String(field),
          before: String(current[field] ?? ""),
          after: String(patch[field] ?? ""),
        });
      }
    }

    setCards((prev) =>
      prev.map((card) =>
        card.id === selectedId ? { ...card, ...patch } : card
      )
    );
    setSaveStatus("수정됨 - 저장 필요");
  }

  function moveCard(id: string, dir: "up" | "down") {
    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index < 0) return prev;

      const target = dir === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      setSaveStatus("수정됨 - 저장 필요");
      return next;
    });
  }

  function deleteCard(id: string) {
    setCards((prev) => {
      const next = prev.filter((card) => card.id !== id);
      setSelectedId(next[0]?.id || "");
      return next;
    });
    setSaveStatus("수정됨 - 저장 필요");
  }

  function duplicateCard(id: string) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;

    const copy = {
      ...card,
      id: `${card.id}-${Date.now()}`,
      title: `${card.title} 복사본`,
    };

    setCards((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setSaveStatus("수정됨 - 저장 필요");
  }


  function buildHtml() {
    const blocks = cards
      .map((card) => {
        const isDark = card.bg === "bg-black";
        return `
<section style="border:3px solid #111;border-radius:24px;padding:28px;margin:18px 0;background:${bgToHex(card.bg)};color:${isDark ? "#fff" : "#111"};">
  <p style="font-weight:900;opacity:.65;">${escapeHtml(card.type)}</p>
  <h2 style="font-size:34px;margin:8px 0;font-weight:950;">${escapeHtml(card.title)}</h2>
  <h3 style="font-size:22px;margin:8px 0;font-weight:900;">${escapeHtml(card.subtitle)}</h3>
  <p style="font-size:19px;line-height:1.6;font-weight:700;">${escapeHtml(card.content)}</p>
  ${
    card.buttonText
      ? `<button style="margin-top:18px;border:0;border-radius:16px;background:#15803d;color:white;padding:16px 24px;font-size:22px;font-weight:900;">${escapeHtml(card.buttonText)}</button>`
      : ""
  }
</section>`;
      })
      .join("\n");

    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(projectName)}</title>
</head>
<body style="margin:0;background:#f4f7f2;font-family:system-ui,Apple SD Gothic Neo,sans-serif;color:#111;">
<main style="max-width:960px;margin:0 auto;padding:24px;">
  <header style="background:#000;color:#fff;border-radius:28px;padding:36px;margin-bottom:24px;">
    <p style="color:#86efac;font-weight:900;font-size:18px;">K-Agri Expo 상세페이지</p>
    <h1 style="font-size:42px;margin:8px 0 0;font-weight:950;">${escapeHtml(projectName)}</h1>
  </header>
  ${blocks}
</main>
</body>
</html>`;
  }

  function exportHtml() {
    const html = buildHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^가-힣a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(v: string) {
    return String(v || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function bgToHex(bg: string) {
    if (bg === "bg-green-100") return "#dcfce7";
    if (bg === "bg-blue-100") return "#dbeafe";
    if (bg === "bg-yellow-100") return "#fef9c3";
    if (bg === "bg-red-100") return "#fee2e2";
    if (bg === "bg-orange-100") return "#ffedd5";
    if (bg === "bg-purple-100") return "#f3e8ff";
    if (bg === "bg-black") return "#000000";
    return "#ffffff";
  }

  async function askAI(instruction: string) {
    try {
      setAiLoading(true);
      setAiAnswer("AI가 상세페이지를 다시 검토하고 있습니다...");

      const res = await fetch("/api/ai-sales/rewrite-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          instruction,
          card: selected,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setAiAnswer(data?.message || "AI 재작성 실패");
        return;
      }

      const result = data.result;
      setAiResult(result);

      updateSelected({
        title: result.title || selected.title,
        subtitle: result.subtitle || selected.subtitle,
        content: result.content || selected.content,
        buttonText: result.buttonText || selected.buttonText,
      });

      setAiAnswer(
        `제목: ${result.title || ""}\n\n부제목: ${result.subtitle || ""}\n\n본문: ${result.content || ""}\n\n버튼: ${result.buttonText || ""}\n\n이유: ${result.reason || ""}`
      );
    } catch (error) {
      console.error(error);
      setAiAnswer("AI 연결 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveBuilder() {
    try {
      setSaveStatus("저장 중...");

      const res = await fetch(`/api/ai-sales/projects/${projectId}/builder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          cards,
          lastChange,
          html: buildHtml(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setSaveStatus("저장 실패");
        return;
      }

      setLastSavedAt(data.data?.updatedAt || "");
      setSaveStatus("저장 완료");
    } catch (error) {
      console.error(error);
      setSaveStatus("저장 오류");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href={`/admin/sales-automation/${projectId}`}
            className="w-fit rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            ← 프로젝트
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportHtml}
              className="rounded-2xl bg-blue-700 px-6 py-4 text-xl font-black text-white"
            >
              HTML 내보내기
            </button>
            <button
              type="button"
              onClick={saveBuilder}
              className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
            >
              저장하기
            </button>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-stone-200">
          <div className="mb-5 rounded-2xl bg-green-50 p-5 text-green-900 ring-1 ring-green-200">
            <label className="mb-4 block">
              <p className="mb-2 text-lg font-black text-green-800">프로젝트명</p>
              <input
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setSaveStatus("프로젝트명 수정됨 - 저장 필요");
                }}
                className="w-full rounded-2xl border-2 border-green-700 bg-white p-4 text-2xl font-black text-black"
                placeholder="예: 싹쓰리충 공동구매 상세페이지"
              />
            </label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-2xl font-black">
                {loadingSaved ? "저장된 빌더 확인 중..." : saveStatus}
              </p>

              <p className="text-lg font-black">
                프로젝트 ID: {projectId}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-green-200">
                <p className="text-base font-black text-green-700">카드 수</p>
                <p className="mt-1 text-3xl font-black">{cards.length}개</p>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-green-200">
                <p className="text-base font-black text-green-700">마지막 저장</p>
                <p className="mt-1 text-lg font-black">
                  {lastSavedAt ? new Date(lastSavedAt).toLocaleString("ko-KR") : "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-green-200">
                <p className="text-base font-black text-green-700">저장 위치</p>
                <p className="mt-1 text-lg font-black">
                  .data/ai-sales-builders/{projectId}.json
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-green-200">
                <p className="text-base font-black text-green-700">최근 변경</p>
                <p className="mt-1 text-lg font-black">
                  {lastChange
                    ? `${lastChange.cardTitle} / ${lastChange.field}`
                    : "-"}
                </p>
              </div>
            </div>

            {lastChange ? (
              <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-lg font-black text-yellow-900 ring-1 ring-yellow-200">
                변경내용: “{lastChange.before}” → “{lastChange.after}”
              </div>
            ) : null}
          </div>
          <p className="text-xl font-black text-green-700">
            농민형 카드 상세페이지 빌더
          </p>

          <h1 className="mt-3 text-5xl font-black">
            긴 설명서 말고, 한눈에 팔리는 카드로 만듭니다
          </h1>

          <p className="mt-4 text-2xl font-bold text-stone-700">
            문제 → 원인 → 해결 → 비교 → 사용법 → 주의사항 → 만화 → 신청
          </p>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_440px]">
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">상세페이지 미리보기</h2>

            <div className="mt-6 grid gap-5">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className={`rounded-3xl border-4 p-6 text-left ${
                    selectedId === card.id
                      ? "border-green-700"
                      : "border-black"
                  } ${card.bg} ${card.bg === "bg-black" ? "text-white" : "text-black"}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black opacity-70">
                        CARD {index + 1}
                      </p>

                      <h3 className="mt-2 text-4xl font-black leading-tight">
                        {card.title}
                      </h3>

                      <p className="mt-3 text-2xl font-black">
                        {card.subtitle}
                      </p>

                      <p className="mt-5 max-w-4xl text-xl font-bold leading-relaxed">
                        {card.content}
                      </p>

                      {card.buttonText ? (
                        <div className="mt-6 inline-flex rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
                          {card.buttonText}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <SmallButton label="↑" onClick={() => moveCard(card.id, "up")} />
                      <SmallButton label="↓" onClick={() => moveCard(card.id, "down")} />
                      <SmallButton label="⧉" variant="copy" onClick={() => duplicateCard(card.id)} />
                      <SmallButton label="🗑" variant="delete" onClick={() => deleteCard(card.id)} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">선택 카드 편집</h2>

            <div className="mt-6 grid gap-5">
              <Field title="제목">
                <input
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="w-full rounded-2xl border-2 border-black p-4 text-xl font-black"
                />
              </Field>

              <Field title="부제목">
                <input
                  value={selected.subtitle}
                  onChange={(e) => updateSelected({ subtitle: e.target.value })}
                  className="w-full rounded-2xl border-2 border-black p-4 text-xl font-black"
                />
              </Field>

              <Field title="본문">
                <textarea
                  value={selected.content}
                  onChange={(e) => updateSelected({ content: e.target.value })}
                  rows={8}
                  className="w-full rounded-2xl border-2 border-black p-4 text-lg font-bold leading-relaxed"
                />
              </Field>

              <Field title="신청 버튼 문구">
                <input
                  value={selected.buttonText || ""}
                  onChange={(e) =>
                    updateSelected({ buttonText: e.target.value })
                  }
                  className="w-full rounded-2xl border-2 border-black p-4 text-xl font-black"
                  placeholder="예: 공동구매 신청하기"
                />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    "공동구매 신청하기",
                    "지금 신청하기",
                    "무료 샘플 받기",
                    "상담 신청하기",
                    "특가 구매하기",
                    "100명 한정 신청",
                    "농가 체험단 신청",
                    "지금 전화상담 받기",
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => updateSelected({ buttonText: label })}
                      className="rounded-xl bg-green-50 p-3 text-base font-black text-green-900 ring-1 ring-green-300 hover:bg-green-100"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-base font-bold text-stone-600">
                  직접 원하는 문구를 입력해도 됩니다. 예: 홍산마늘 농가 모집, 곤충사육 교육 신청
                </p>
              </Field>

              <Field title="카드 배경">
                <select
                  value={selected.bg}
                  onChange={(e) => updateSelected({ bg: e.target.value })}
                  className="w-full rounded-2xl border-2 border-black p-4 text-xl font-black"
                >
                  <option value="bg-white">흰색</option>
                  <option value="bg-green-100">초록</option>
                  <option value="bg-blue-100">파랑</option>
                  <option value="bg-yellow-100">노랑</option>
                  <option value="bg-red-100">빨강</option>
                  <option value="bg-orange-100">주황</option>
                  <option value="bg-purple-100">보라</option>
                  <option value="bg-black">검정</option>
                </select>
              </Field>

              <button
                type="button"
                onClick={() => askAI("이 카드를 농민이 바로 공감하고 신청하고 싶게 다시 작성해줘")}
                className="rounded-2xl bg-stone-900 px-6 py-5 text-xl font-black text-white"
              >
                이 카드 AI 재작성
              </button>

              <button className="rounded-2xl bg-blue-700 px-6 py-5 text-xl font-black text-white">
                이 카드 이미지 프롬프트 생성
              </button>

              <button className="rounded-2xl bg-green-700 px-6 py-5 text-xl font-black text-white">
                기존 주문시스템 연결 확인
              </button>

              <div className="mt-8 rounded-3xl border-2 border-black p-5">
                <h3 className="text-2xl font-black">
                  🤖 AI 공동작업실
                </h3>

                <p className="mt-2 text-sm text-stone-600">
                  현재 카드 또는 전체 상세페이지를 AI와 함께 수정합니다.
                </p>

                <textarea
                  rows={5}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="예) 이 제목 더 강하게 만들어줘, CTA를 더 세게 만들어줘, 농민들이 공감하게 바꿔줘"
                  className="mt-4 w-full rounded-2xl border-2 border-black p-4"
                />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => askAI("제목을 더 강하고 클릭하고 싶게 바꿔줘")}
                    className="rounded-xl bg-blue-600 p-3 font-black text-white"
                  >
                    제목 강하게
                  </button>

                  <button
                    type="button"
                    onClick={() => askAI("농민들이 쓰는 말투로 쉽게 바꿔줘")}
                    className="rounded-xl bg-green-600 p-3 font-black text-white"
                  >
                    농민 말투
                  </button>

                  <button
                    type="button"
                    onClick={() => askAI("공동구매 신청 전환율이 높아지게 바꿔줘")}
                    className="rounded-xl bg-orange-600 p-3 font-black text-white"
                  >
                    공동구매 전환
                  </button>

                  <button
                    type="button"
                    onClick={() => askAI("이 카드 내용을 유튜브 쇼츠 첫 3초 후킹처럼 바꿔줘")}
                    className="rounded-xl bg-purple-600 p-3 font-black text-white"
                  >
                    쇼츠용 변환
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => askAI(aiPrompt || "이 카드를 더 좋게 고쳐줘")}
                  disabled={aiLoading}
                  className="mt-4 w-full rounded-2xl bg-black px-6 py-4 text-xl font-black text-white disabled:opacity-50"
                >
                  {aiLoading ? "AI 작업 중..." : "AI에게 묻기"}
                </button>

                <div className="mt-4 rounded-2xl bg-stone-100 p-4">
                  <p className="font-black">AI 답변</p>

                  <pre className="mt-2 whitespace-pre-wrap text-sm font-bold text-stone-700">
                    {aiAnswer}
                  </pre>

                  {aiResult ? (
                    <button
                      type="button"
                      onClick={() => {
                        updateSelected({
                          title: aiResult.title || selected.title,
                          subtitle: aiResult.subtitle || selected.subtitle,
                          content: aiResult.content || selected.content,
                          buttonText: aiResult.buttonText || selected.buttonText,
                        });
                        setSaveStatus("AI 결과 적용됨 - 저장 필요");
                      }}
                      className="mt-3 w-full rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white"
                    >
                      ✅ AI 결과 카드에 적용
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <p className="mb-3 text-2xl font-black">{title}</p>
      {children}
    </label>
  );
}

function SmallButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "copy" | "delete";
}) {
  const cls =
    variant === "delete"
      ? "bg-red-600 text-white ring-red-700 hover:bg-red-700"
      : variant === "copy"
        ? "bg-blue-600 text-white ring-blue-700 hover:bg-blue-700"
        : "bg-white text-black ring-black hover:bg-stone-100";

  return (
    <button
      type="button"
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`min-w-[52px] rounded-xl px-4 py-3 text-2xl font-black ring-2 ${cls}`}
    >
      {label}
    </button>
  );
}
