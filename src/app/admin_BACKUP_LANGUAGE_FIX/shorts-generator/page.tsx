"use client";

import { useState } from "react";

export default function ShortsGeneratorPage() {
  const [product, setProduct] = useState("");
  const [crop, setCrop] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState("");

  function generate() {
    setResult(`
━━━━━━━━━━━━━━━━━━
🎬 8초 쇼츠
━━━━━━━━━━━━━━━━━━

아줌마

왜 ${crop}가 저래?

옆집 농부

${product} 안 쳤제?

${product} 등장

"그래서 달라졌부렀네"

━━━━━━━━━━━━━━━━━━
🎬 15초 쇼츠
━━━━━━━━━━━━━━━━━━

0~3초

${crop} 상태 불량

3~6초

농민 한숨

6~10초

이웃 농민 등장

10~15초

${product} 소개

자막

"${problem} 때문에 고민이라면"

"${product}"

━━━━━━━━━━━━━━━━━━
🎬 30초 쇼츠
━━━━━━━━━━━━━━━━━━

농민

올해도 망했네...

${problem} 심각

옆집 농부

그걸 안 쳤으니 그렇지

${product} 등장

비포 애프터

자막

"이래서 찾습니다"

━━━━━━━━━━━━━━━━━━
🎥 Veo3 Prompt
━━━━━━━━━━━━━━━━━━

Korean farmer,
${crop} farm,
rural village,
funny conversation,
old farmer woman,
cinematic,
commercial style,
${product},
8 seconds

━━━━━━━━━━━━━━━━━━
🎥 Kling Prompt
━━━━━━━━━━━━━━━━━━

Korean countryside,
farmer dialogue,
${crop},
before after effect,
commercial,
dramatic,
8 second ad,
${product}

━━━━━━━━━━━━━━━━━━
🎥 Hailuo Prompt
━━━━━━━━━━━━━━━━━━

Funny Korean farmer commercial,
${crop},
problem : ${problem},
solution : ${product},
viral short video,
8 sec
`);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5">
      <div className="mx-auto max-w-6xl">

        <section className="rounded-3xl bg-gradient-to-r from-purple-900 via-purple-700 to-pink-600 p-8 text-white">
          <h1 className="text-5xl font-black">
            AI 쇼츠 생성기
          </h1>

          <p className="mt-4 text-2xl font-bold">
            제품 하나로 쇼츠와 영상 프롬프트를 자동 생성합니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

          <div className="grid gap-5 md:grid-cols-3">

            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="제품명"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="작물"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="문제점"
              className="rounded-2xl border p-5 text-xl font-bold"
            />

          </div>

          <button
            onClick={generate}
            className="mt-6 w-full rounded-3xl bg-purple-700 py-6 text-3xl font-black text-white"
          >
            쇼츠 생성하기
          </button>

        </section>

        {result && (
          <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

            <h2 className="text-4xl font-black">
              생성 결과
            </h2>

            <pre className="mt-6 whitespace-pre-wrap rounded-3xl bg-stone-100 p-6 text-lg font-bold">
              {result}
            </pre>

          </section>
        )}

      </div>
    </main>
  );
}