"use client";

import { useState } from "react";

type Idea = {
  id: number;
  title: string;
  memo: string;
  type: string;
};

export default function CreativeRoomClient() {
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: 1,
      title: "손주와 여행",
      memo: "무릎 때문에 약속을 못 지키는 할아버지 이야기",
      type: "감동",
    },
    {
      id: 2,
      title: "옆집은 멀쩡한데",
      memo: "옆집 밭만 잘되는 이유를 궁금해하는 농부 이야기",
      type: "코미디",
    },
    {
      id: 3,
      title: "정명수 대표의 15년",
      memo: "곤충에 인생을 건 미래식량 개척자 이야기",
      type: "미래식량",
    },
  ]);

  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");

  function addIdea() {
    if (!title.trim() && !memo.trim()) return;

    setIdeas((prev) => [
      {
        id: Date.now(),
        title: title.trim() || "제목 없는 아이디어",
        memo: memo.trim() || "메모 없음",
        type: "자유기획",
      },
      ...prev,
    ]);

    setTitle("");
    setMemo("");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-black p-8 text-white shadow-xl">
          <p className="text-xl font-black text-green-300">
            K-Agri AI Creative Room
          </p>
          <h1 className="mt-3 text-5xl font-black">AI 작가실</h1>
          <p className="mt-4 text-2xl font-bold">
            현장에서 떠오른 아이디어, 인터뷰, 녹음 내용을 웹툰·쇼츠·광고·상세페이지로 키우는 공간입니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">아이디어 저장</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-2 border-black p-5 text-xl font-black"
              placeholder="예: 손주와 여행"
            />

            <button
              onClick={addIdea}
              className="rounded-2xl bg-green-700 p-5 text-2xl font-black text-white"
            >
              + 아이디어 저장
            </button>
          </div>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={7}
            className="mt-5 w-full rounded-2xl border-2 border-black p-5 text-xl font-bold"
            placeholder="예: 오늘 시골 가다가 생각났는데, 옆집은 보일러 놨는데 우린 필요없다고 우기던 농부 이야기..."
          />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">아이디어 금고</h2>

          <div className="mt-8 grid gap-5">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-3xl border-4 border-black bg-stone-50 p-6"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-black text-green-700">
                      {idea.type}
                    </p>
                    <h3 className="mt-2 text-3xl font-black">{idea.title}</h3>
                    <p className="mt-3 text-xl font-bold text-stone-700">
                      {idea.memo}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-2xl bg-purple-700 px-5 py-4 text-lg font-black text-white">
                    웹툰 만들기
                  </button>
                  <button className="rounded-2xl bg-blue-700 px-5 py-4 text-lg font-black text-white">
                    쇼츠 만들기
                  </button>
                  <button className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white">
                    광고 만들기
                  </button>
                  <button className="rounded-2xl bg-black px-5 py-4 text-lg font-black text-white">
                    상세페이지 만들기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
