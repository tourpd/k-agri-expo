"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type VideoLength = "8초" | "15초" | "30초";
type CharacterKey =
  | "슈퍼농부"
  | "안철현 박사"
  | "직설하는 영희"
  | "철수동무"
  | "조세환 PD";

const characters: Record<CharacterKey, { tone: string; line: string }> = {
  "슈퍼농부": {
    tone: "경상도 사투리 / 현장 실전형",
    line: "와이라노! 이거 그냥 두면 안 된다 아이가!",
  },
  "안철현 박사": {
    tone: "전문가 말투 / 작물생리 설명형",
    line: "작물이 스트레스를 받으면 생리장해가 먼저 나타납니다.",
  },
  "직설하는 영희": {
    tone: "전라도 직설 말투 / 팩트체커형",
    line: "그래서 농민한테 실제로 뭐가 도움 되는디요?",
  },
  "철수동무": {
    tone: "함경도 말투 / 신기술 질문형",
    line: "이런 방법도 있었습네까?",
  },
  "조세환 PD": {
    tone: "방송 PD 말투 / 진행자형",
    line: "농민 여러분, 이건 지금 꼭 보셔야 합니다.",
  },
};

export default function VideoFactoryPage() {
  const [productName, setProductName] = useState("블로킹칼");
  const [crop, setCrop] = useState("고추");
  const [problem, setProblem] = useState("폭염으로 인한 일소피해");
  const [solution, setSolution] = useState("강한 햇빛과 고온 스트레스 관리");
  const [character, setCharacter] = useState<CharacterKey>("슈퍼농부");
  const [length, setLength] = useState<VideoLength>("8초");
  const [style, setStyle] = useState("긴급뉴스형");

  const output = useMemo(() => {
    const c = characters[character];

    return {
      title: `🚨 ${crop} ${problem} 긴급 대응`,
      hook: `${crop}가 정상으로 보입니까? 지금 타고 있을 수 있습니다.`,
      storyboard:
`${length} 광고 콘티

0~2초
강한 햇빛 아래 ${crop} 밭 클로즈업.
피해 부위가 보이는 장면.
자막: "${crop}, 익는 게 아니라 타는 걸 수 있습니다."

2~5초
${character} 등장.
대사: "${c.line}"
자막: "${problem}"

5~${length === "8초" ? "8" : length === "15초" ? "15" : "30"}초
제품 ${productName} 노출.
해결 메시지: "${solution}"
CTA: "지금 공동구매 확인하기"`,
      subtitles:
`${crop}, 익는 게 아닙니다
${problem}
${productName}으로 미리 관리하세요
지금 공동구매 확인`,
      geminiPrompt:
`Create a realistic vertical Korean agricultural advertisement video.

Length: ${length}
Format: 9:16 YouTube Shorts
Style: ${style}
Product: ${productName}
Crop: ${crop}
Problem: ${problem}
Solution: ${solution}

Scene:
A realistic Korean farm under strong summer sunlight.
Show close-up of ${crop} suffering from ${problem}.
A Korean character named ${character} appears and explains in ${c.tone}.
The tone should feel urgent, practical, and trustworthy for Korean farmers.
End with a clean product-style scene showing ${productName} as the solution.

Dialogue in Korean:
"${c.line}"

Add bold Korean subtitles:
"${crop}, 익는 게 아닙니다"
"${problem}"
"${productName}으로 미리 관리하세요"

Realistic documentary commercial style, high quality, natural daylight, Korean rural farm.`,
      thumbnail: `${crop}가 익는 게 아닙니다. 타고 있는 겁니다.`,
      cta: "공동구매 신청하기",
    };
  }, [productName, crop, problem, solution, character, length, style]);

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin/kagri-writers-room"
            className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            ← K-Agri 작가실
          </Link>

          <Link
            href="/admin/sales-automation/test/builder"
            className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
          >
            상세페이지 빌더 →
          </Link>
        </div>

        <section className="rounded-3xl bg-black p-8 text-white shadow-xl">
          <p className="text-xl font-black text-green-300">
            K-Agri AI Sales Automation
          </p>
          <h1 className="mt-3 text-5xl font-black">
            🎬 AI 판매영상 공장
          </h1>
          <p className="mt-4 text-2xl font-bold text-stone-200">
            업체가 제품사진·PDF만 올려도 8초 광고, Gemini 프롬프트, 상세페이지 문구까지 뽑는 판매자동화 공장입니다.
          </p>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">📦 제품 입력</h2>

            <div className="mt-6 grid gap-5">
              <Field label="제품명" value={productName} onChange={setProductName} />
              <Field label="대상 작물" value={crop} onChange={setCrop} />
              <Field label="농민 문제" value={problem} onChange={setProblem} />
              <Field label="해결 메시지" value={solution} onChange={setSolution} />

              <label>
                <p className="mb-2 text-xl font-black">캐릭터</p>
                <select
                  value={character}
                  onChange={(e) => setCharacter(e.target.value as CharacterKey)}
                  className="w-full rounded-2xl border-4 border-black p-4 text-xl font-bold"
                >
                  {Object.keys(characters).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label>
                <p className="mb-2 text-xl font-black">영상 길이</p>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as VideoLength)}
                  className="w-full rounded-2xl border-4 border-black p-4 text-xl font-bold"
                >
                  <option>8초</option>
                  <option>15초</option>
                  <option>30초</option>
                </select>
              </label>

              <label>
                <p className="mb-2 text-xl font-black">광고 스타일</p>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-2xl border-4 border-black p-4 text-xl font-bold"
                >
                  <option>긴급뉴스형</option>
                  <option>농촌코미디형</option>
                  <option>전문가설명형</option>
                  <option>실험비교형</option>
                  <option>감성광고형</option>
                  <option>직설팩트형</option>
                </select>
              </label>

              <div className="rounded-3xl border-4 border-dashed border-black p-6">
                <p className="text-2xl font-black">📎 제품사진 / PDF 업로드</p>
                <p className="mt-2 text-lg font-bold text-stone-700">
                  1차 버전은 화면 골격입니다. 다음 단계에서 파일 업로드와 PDF 분석 API를 연결합니다.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">✅ 자동 생성 결과</h2>

            <ResultBox title="광고 제목" content={output.title} />
            <ResultBox title="첫 3초 후킹" content={output.hook} />
            <ResultBox title="콘티" content={output.storyboard} />
            <ResultBox title="자막" content={output.subtitles} />
            <ResultBox title="Gemini / Veo 프롬프트" content={output.geminiPrompt} />
            <ResultBox title="썸네일 문구" content={output.thumbnail} />
            <ResultBox title="신청 버튼 문구" content={output.cta} />

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white">
                상세페이지에 적용
              </button>
              <button className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
                프롬프트 복사
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <p className="mb-2 text-xl font-black">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-4 border-black p-4 text-xl font-bold"
      />
    </label>
  );
}

function ResultBox({ title, content }: { title: string; content: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-stone-100 p-5">
      <p className="text-xl font-black">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap text-lg font-bold leading-relaxed text-stone-800">
        {content}
      </pre>
    </div>
  );
}
