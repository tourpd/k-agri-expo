"use client";

import { FormEvent, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type MemorySource = {
  path: string;
  score: number;
};

type ChatResponse = {
  ok: boolean;
  reply?: string;
  error?: string;
  desk?: {
    review: string;
    authority: "JOPD_ONLY";
  };
  memory?: {
    count: number;
    sources: MemorySource[];
  };
};


export default function KagriWritersRoomPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "조PD, 작가실 열었습니다. 오늘 뭘 만들어볼까요? 한 줄짜리 생각이어도 됩니다. 같이 작품으로 키워보죠.",
    },
  ]);

  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [deskReview, setDeskReview] = useState("");
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const [showDeskReview, setShowDeskReview] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function startNewConversation() {
    setMessages([
      {
        role: "assistant",
        content:
          "조PD, 새 작가회의 시작하겠습니다. 이번에는 뭘 만들어볼까요?",
      },
    ]);
    setInput("");
    setDeskReview("");
    setShowDeskReview(false);
    setShowOlderMessages(false);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function copyConversation() {
    const conversation = messages
      .map(
        (message) =>
          `${message.role === "assistant" ? "수석작가" : "조PD"}\n${message.content}`
      )
      .join("\n\n");

    await copyText(conversation);
  }

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();

    if (!message || working) return;

    const history = messages
      .filter(
        (item, index) =>
          !(index === 0 && item.role === "assistant")
      )
      .slice(-20);

    setInput("");
    setError("");
    setWorking(true);

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: message },
    ];

    setMessages(nextMessages);

    try {
      const response = await fetch(
        "/api/kagri-writers-room/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            history,
            workId: "SANGBONG_WEBTOON",
          }),
        }
      );

      const data: ChatResponse = await response.json();

      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(
          data.error || "수석작가 응답에 실패했습니다."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply as string,
        },
      ]);

    setDeskReview(data.desk?.review || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "수석작가 호출 중 오류가 발생했습니다."
      );
    } finally {
      setWorking(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <main className="min-h-screen bg-[#f3f1ec] text-[#20211f]">
      <div className="mx-auto min-h-screen max-w-[1180px] bg-[#faf9f6]">
        <header className="flex items-center justify-between border-b border-black/10 px-8 py-5">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl font-bold tracking-tight">
              AI 작가실
            </h1>
            <span className="text-xs font-medium text-black/35">
              JOPD AI STUDIO
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-black/45">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            수석작가 LIVE
          </div>
        </header>

        {messages.length === 1 ? (
          <section className="px-8 py-10 lg:px-12">
            <div className="max-w-[980px]">
              <p className="text-sm font-bold text-emerald-700">
                창작 미션
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight lg:text-3xl">
                무엇을 만들까요?
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/45">
                만들고 싶은 것, 해결하고 싶은 것, 떠오른 생각을 그냥 말하세요.
                수석작가가 여러 방향으로 펼쳐봅니다.
              </p>

              <form
                onSubmit={submit}
                className="mt-7 border border-black/15 bg-white p-5 shadow-sm"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={7}
                  autoFocus
                  placeholder="예: 기아 상봉대리점을 홍보해야 한다. 기존 유튜브에 있는 방식 말고 완전히 새로운 방식으로, 가장 핫하고 재미있는 아이디어 10개 만들어줘."
                  className="w-full resize-none bg-transparent text-[16px] leading-8 text-[#20211f] outline-none placeholder:text-black/30"
                />

                <div className="mt-3 flex items-center justify-between border-t border-black/[0.07] pt-4">
                  <span className="text-[11px] text-black/30">
                    Enter 전송 · Shift+Enter 줄바꿈
                  </span>

                  <button
                    type="submit"
                    disabled={working || !input.trim()}
                    className="bg-[#20211f] px-6 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    {working ? "생각 중..." : "수석작가와 시작"}
                  </button>
                </div>
              </form>

              <div className="mt-7 border-t border-black/10 pt-5">
                <p className="mb-3 text-xs font-bold text-black/35">
                  이렇게 시작해도 됩니다
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "새로운 아이디어 10개 만들어줘",
                    "완전히 다른 방향으로 뒤집어봐",
                    "가장 재미있는 사람 이야기를 찾아봐",
                    "더 과감하고 미친 방향으로 가봐",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black/55 transition hover:border-black/30 hover:text-black"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-6 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="flex min-h-[calc(100vh-69px)] flex-col">
            <div className="flex items-center justify-between border-b border-black/10 px-8 py-4 lg:px-12">
              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] text-emerald-700">
                  WRITERS&apos; ROOM
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  조PD × 수석작가
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {messages.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowOlderMessages((current) => !current)}
                    className="border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/50 hover:border-black/25 hover:text-black"
                  >
                    {showOlderMessages
                      ? "이전 회의 접기"
                      : `이전 회의 ${messages.length - 4}개 보기`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void copyConversation()}
                  className="border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/50 hover:border-black/25 hover:text-black"
                >
                  대화 복사
                </button>

                <button
                  type="button"
                  onClick={startNewConversation}
                  className="bg-[#20211f] px-3 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  + 새 대화
                </button>
              </div>
            </div>

            <div className="flex-1 px-8 py-8 lg:px-12">
              <div className="max-w-[940px] space-y-10">
                {(showOlderMessages ? messages : messages.slice(-4)).map(
                  (message, index) => (
                    <article
                      key={`${message.role}-${index}`}
                      className={
                        message.role === "user"
                          ? "border-l-2 border-black/20 pl-5"
                          : ""
                      }
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <p
                          className={
                            message.role === "assistant"
                              ? "text-xs font-bold text-emerald-700"
                              : "text-xs font-bold text-black/40"
                          }
                        >
                          {message.role === "assistant" ? "수석작가" : "조PD"}
                        </p>

                        {message.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => void copyText(message.content)}
                            className="text-[11px] font-medium text-black/30 hover:text-black"
                          >
                            복사
                          </button>
                        )}
                      </div>

                      <div className="text-[15px] leading-7 text-black/80">
                        {message.content.split("\n").map((line, lineIndex) => {
                          const trimmed = line.trim();

                          if (!trimmed) {
                            return <div key={lineIndex} className="h-3" />;
                          }

                          if (/^-{3,}$/.test(trimmed)) {
                            return (
                              <div
                                key={lineIndex}
                                className="my-6 border-t border-black/10"
                              />
                            );
                          }

                          const heading = trimmed.match(/^#{1,4}\s+(.+)$/);

                          if (heading) {
                            const title = heading[1].replace(/\*\*/g, "");

                            return (
                              <h3
                                key={lineIndex}
                                className="mt-8 border-l-4 border-emerald-600 bg-[#f3f1ec] px-5 py-4 text-xl font-bold leading-7 text-black first:mt-0"
                              >
                                {title}
                              </h3>
                            );
                          }

                          const bullet = trimmed.match(/^[-*]\s+(.+)$/);

                          if (bullet) {
                            return (
                              <div
                                key={lineIndex}
                                className="flex gap-3 py-1 pl-5"
                              >
                                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                                <p>{bullet[1].replace(/\*\*/g, "")}</p>
                              </div>
                            );
                          }

                          const emphasis = trimmed.match(
                            /^\*\*(.+?):\*\*\s*(.*)$/
                          );

                          if (emphasis) {
                            return (
                              <div
                                key={lineIndex}
                                className="my-3 border-l-2 border-emerald-600/50 pl-4"
                              >
                                <span className="font-bold text-black">
                                  {emphasis[1]}
                                </span>
                                {emphasis[2] && (
                                  <span className="ml-2">
                                    {emphasis[2].replace(/\*\*/g, "")}
                                  </span>
                                )}
                              </div>
                            );
                          }

                          if (trimmed.startsWith(">")) {
                            return (
                              <blockquote
                                key={lineIndex}
                                className="my-3 border-l-2 border-black/20 pl-4 text-lg font-medium text-black/70"
                              >
                                {trimmed
                                  .replace(/^>\s?/, "")
                                  .replace(/\*\*/g, "")}
                              </blockquote>
                            );
                          }

                          return (
                            <p key={lineIndex} className="py-1">
                              {trimmed.replace(/\*\*/g, "")}
                            </p>
                          );
                        })}
                      </div>
                    </article>
                  )
                )}

                {working && (
                  <div>
                    <p className="mb-2 text-xs font-bold text-emerald-700">
                      수석작가
                    </p>
                    <p className="text-sm text-black/40">
                      아이디어를 펼치고 있습니다...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-black/10 bg-[#faf9f6]/95 px-8 py-5 backdrop-blur lg:px-12">
              <form
                onSubmit={submit}
                className="max-w-[980px] border border-black/15 bg-white p-4 shadow-sm"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={3}
                  placeholder="작가에게 바로 말하세요. 예: 3번은 살리고 7번과 섞어봐. 더 웃기게. 완전히 다른 5개도 보여줘."
                  className="w-full resize-none bg-transparent text-[15px] leading-7 text-[#20211f] outline-none placeholder:text-black/25"
                />

                <div className="mt-2 flex items-center justify-between border-t border-black/[0.07] pt-3">
                  <span className="text-[11px] text-black/25">
                    Enter 전송 · Shift+Enter 줄바꿈
                  </span>

                  <button
                    type="submit"
                    disabled={working || !input.trim()}
                    className="bg-[#20211f] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    {working ? "생각 중..." : "보내기"}
                  </button>
                </div>
              </form>

              {deskReview && (
                <div className="mt-3 max-w-[980px]">
                  <button
                    type="button"
                    onClick={() => setShowDeskReview((current) => !current)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs text-black/35">
                      Reality Desk · 현실 확인할 부분이 있습니다
                    </span>
                    <span className="text-[11px] font-bold text-black/35">
                      {showDeskReview ? "접기" : "보기"}
                    </span>
                  </button>

                  {showDeskReview && (
                    <p className="mt-3 whitespace-pre-wrap border-t border-black/[0.07] pt-3 text-xs leading-6 text-black/55">
                      {deskReview}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
