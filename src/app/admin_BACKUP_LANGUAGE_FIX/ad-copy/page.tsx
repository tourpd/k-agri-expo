"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";

export default function AdCopyPage() {
  const [industry, setIndustry] = useState("agriculture");
  const [product, setProduct] = useState("");
  const [target, setTarget] = useState("");
  const [problem, setProblem] = useState("");
  const [crop, setCrop] = useState("");
  const [pest, setPest] = useState("");
  const [style, setStyle] = useState("fear");
  const [result, setResult] = useState("");

  function generate() {
    const industryLabel =
      industry === "agriculture"
        ? "농자재"
        : industry === "produce"
        ? "농산물"
        : industry === "processed"
        ? "가공식품"
        : industry === "fishery"
        ? "수산물"
        : industry === "health"
        ? "건강기능식품"
        : industry === "futurefood"
        ? "미래식량"
        : industry === "healing"
        ? "치유농업"
        : industry === "education"
        ? "교육상품"
        : "농기계";

    let adText = "";

    switch (style) {
      case "fear":
        adText = `
[공포형 광고]

${problem || pest}은 보이는 순간 이미 늦습니다.

지금 준비하지 않으면
후회는 당신의 몫입니다.

추천 제품 : ${product}
`;
        break;

      case "dialect":
        adText = `
[사투리형 광고]

아지매~

${crop || target}가 왜 저래?

${product} 안 썼제?

그래가 그런겨~

옆집은 벌써 했당께.
`;
        break;

      case "neighbor":
        adText = `
[옆집 농부형]

김씨:
왜 니 ${crop || target}는 저리 좋노?

박씨:
아직도 몰라?

${product} 썼제.
`;
        break;

      case "drinking":
        adText = `
[술자리형]

김씨:
나는 망했는데 왜 자네는 잘 되나?

박씨:
그거 하나 차이여.

${product}
`;
        break;

      case "drama":
        adText = `
[상황극형]

고객:
아이고 큰일났네.

${problem || pest} 올라왔네.

이웃농부:
그래서 다들

${product}

쓰는겨.
`;
        break;

      default:
        adText = `${product}`;
    }

    setResult(`
━━━━━━━━━━━━━━━━━━

산업군 : ${industryLabel}

제품 : ${product}

타겟 : ${target}

고객 고민 : ${problem}

작물 : ${crop}

병해충 : ${pest}

━━━━━━━━━━━━━━━━━━

${adText}

━━━━━━━━━━━━━━━━━━
8초 쇼츠

아지매:
왜 저래?

옆집 농부:
${product} 안 썼잖여~

아지매:
그래서 달라졌부렀네!

━━━━━━━━━━━━━━━━━━
15초 쇼츠

문제 발생
↓
고객 고민
↓
옆집 농부 등장
↓
${product} 소개
↓
구매 유도

━━━━━━━━━━━━━━━━━━
Veo3 Prompt

Korean farmer commercial,
${product},
${crop},
${problem},
cinematic,
viral short video,
8 seconds

━━━━━━━━━━━━━━━━━━
Kling Prompt

Farmer marketing video,
${product},
before after,
rural Korea,
commercial style
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5">
      <div className="mx-auto max-w-6xl">

        <section className="rounded-3xl bg-gradient-to-r from-red-900 via-red-700 to-orange-500 p-8 text-white">
          <h1 className="text-5xl font-black">
            AI 판매전략 생성기
          </h1>

          <p className="mt-4 text-2xl font-bold">
            광고 · 쇼츠 · 영상 프롬프트 자동 생성
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

          <div className="grid gap-5 md:grid-cols-2">

            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-2xl border p-5 text-xl font-bold"
            >
              <option value="agriculture">농자재</option>
              <option value="produce">농산물</option>
              <option value="processed">가공식품</option>
              <option value="fishery">수산물</option>
              <option value="health">건강기능식품</option>
              <option value="futurefood">미래식량</option>
              <option value="healing">치유농업</option>
              <option value="education">교육상품</option>
              <option value="machinery">농기계</option>
            </select>

            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="제품명"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="타겟 고객"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="고객 고민"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="작물 또는 분야"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={pest}
              onChange={(e) => setPest(e.target.value)}
              placeholder="병해충 또는 문제"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="rounded-2xl border p-5 text-xl font-bold"
            >
              <option value="fear">공포형</option>
              <option value="dialect">사투리형</option>
              <option value="neighbor">옆집농부형</option>
              <option value="drinking">술자리형</option>
              <option value="drama">상황극형</option>
            </select>

          </div>

          <button
            onClick={generate}
            className="mt-6 w-full rounded-3xl bg-red-700 py-6 text-3xl font-black text-white"
          >
            판매전략 생성하기
          </button>

        </section>

        {result && (
          <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-black">
              생성 결과
            </h2>

            <pre className="mt-6 whitespace-pre-wrap rounded-3xl bg-stone-100 p-6 text-lg font-bold overflow-auto">
              {result}
            </pre>
          </section>
        )}

      </div>
    </main>
  );
}