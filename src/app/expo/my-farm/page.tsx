"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Concern = "pest" | "yield" | "price" | "material" | "market" | "free" | "";

const concerns = [
  { id: "pest", icon: "🐛", title: "병해충이 걱정된다", desc: "지금 생길 병해충과 방제 시기를 알려드립니다." },
  { id: "yield", icon: "🌱", title: "수확량을 늘리고 싶다", desc: "생육 단계별 관리와 필요한 영양을 알려드립니다." },
  { id: "price", icon: "💰", title: "내 농산물 가격이 걱정된다", desc: "출하·저장·가공·가격전망 정보를 제공합니다." },
  { id: "material", icon: "🛒", title: "좋은 농자재를 찾고 싶다", desc: "작물과 시기에 맞는 자재를 추천합니다." },
  { id: "market", icon: "🚚", title: "판로가 필요하다", desc: "직거래·중간상·업체 연결을 준비합니다." },
  { id: "free", icon: "🎙️", title: "농사 고민을 직접 입력", desc: "말이나 글로 농사 고민을 직접 질문하세요." },
] as const;

const crops = ["고추", "마늘", "양파", "딸기", "오이", "토마토", "복숭아", "사과", "배", "기타"];

function getConcernText(v: Concern) {
  if (v === "pest") return "병해충 경보와 방제 시기";
  if (v === "yield") return "수확량 향상 관리";
  if (v === "price") return "내 농산물 가격·출하 판단";
  if (v === "material") return "맞춤 농자재 추천";
  if (v === "market") return "판로 연결";
  if (v === "free") return "자유 농사 상담";
  return "농사관리";
}

export default function MyFarmPage() {
  const [step, setStep] = useState(1);
  const [concern, setConcern] = useState<Concern>("");
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [freeQuestion, setFreeQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  function startVoiceInput() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setVoiceMessage("음성 인식이 잘 안 됩니다. 아래 입력창에 직접 적어주세요.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    setVoiceMessage("듣는 중입니다. 말씀이 끝나면 ‘끝’ 또는 ‘오버’라고 말씀해 주세요.");

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const shouldFinish =
        transcript.includes("끝") ||
        transcript.includes("오버") ||
        transcript.includes("이상입니다") ||
        transcript.includes("여기까지");

      const cleaned = transcript
        .replace(/끝\.?$/g, "")
        .replace(/오버\.?$/g, "")
        .replace(/이상입니다\.?$/g, "")
        .replace(/여기까지입니다\.?$/g, "")
        .trim();

      setFreeQuestion((prev) => `${prev ? prev + " " : ""}${cleaned}`.trim());
      setListening(false);
      setVoiceMessage("음성이 입력되었습니다. 부족하면 직접 수정해 주세요.");

      if (shouldFinish && cleaned.trim()) {
        setTimeout(() => setStep(4), 300);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setVoiceMessage("음성 인식이 잘 안 됩니다. 아래 입력창에 직접 적어주세요.");
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  }

  const ready = concern === "free" ? Boolean(freeQuestion.trim()) : Boolean(concern && crop && region);

  const result = useMemo(() => {
    return {
      stage: crop === "고추" ? "착과·비대 준비기" : "생육관리 단계",
      warning:
        crop === "고추"
          ? ["총채벌레 예찰", "고온장해 대비", "칼슘 부족 주의"]
          : ["병해충 예찰", "생육상태 확인", "영양관리 점검"],
      materials:
        crop === "고추"
          ? ["충해 방제 자재", "칼슘·붕소 영양제", "고온장해 완화제"]
          : ["생육관리 영양제", "병해충 예방 자재", "토양관리 자재"],
    };
  }, [crop]);

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-slate-950">
      <header className="border-b bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/expo" className="text-2xl font-black text-emerald-700">
            K-AGRI EXPO
          </Link>
          <Link href="/" className="rounded-xl border bg-white px-4 py-2 font-black">
            홈으로
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="rounded-3xl bg-emerald-700 p-7 text-white shadow-xl">
          <div className="text-sm font-black opacity-90">AI 농장비서</div>
          <h1 className="mt-2 text-4xl font-black leading-tight">
            오늘 농사에서 가장 궁금한 것이 무엇입니까?
          </h1>
          <p className="mt-3 text-lg font-bold opacity-95">
            작물과 지역만 알려주시면, 농사캘린더·병해충 경보·추천 농자재·판로 정보를 먼저 보여드립니다.
          </p>
        </div>

        {step === 1 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {concerns.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setConcern(item.id as Concern);
                  setStep(item.id === "free" ? 10 : 2);
                }}
                className="rounded-2xl border bg-white p-6 text-left shadow-sm hover:border-emerald-500 hover:bg-emerald-50"
              >
                <div className="text-4xl">{item.icon}</div>
                <div className="mt-3 text-2xl font-black">{item.title}</div>
                <div className="mt-2 text-base font-bold text-slate-600">{item.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 10 && (
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-emerald-700">농사 고민 직접 입력</div>
            <h2 className="mt-2 text-3xl font-black">농사 고민을 직접 적어주세요</h2>
            <p className="mt-2 text-lg font-bold text-slate-600">
              예: 고추 잎이 오그라듭니다 / 마늘 가격이 걱정됩니다 / 토양검정 결과를 봐주세요
            </p>

            <textarea
              value={freeQuestion}
              onChange={(e) => setFreeQuestion(e.target.value)}
              placeholder="예: 고추 잎이 오그라듭니다. 어떻게 해야 하나요?"
              className="mt-5 min-h-[180px] w-full rounded-2xl border px-5 py-4 text-xl font-bold leading-9"
            />

            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-base font-black text-amber-900">
              음성 질문은 보조 기능입니다. 말로 질문할 때는 마지막에 “끝” 또는 “오버”라고 말씀해 주세요.
            </div>

            {voiceMessage ? (
              <div className={`mt-3 rounded-2xl p-4 text-lg font-black ${
                listening ? "border border-red-200 bg-red-50 text-red-700" : "border bg-slate-50 text-slate-700"
              }`}>
                🎙️ {voiceMessage}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={startVoiceInput}
                className={`h-16 rounded-2xl px-8 text-xl font-black text-white ${
                  listening ? "bg-red-600" : "bg-slate-900"
                }`}
              >
                {listening ? "🎙️ 듣는 중..." : "🎙️ 말로 질문하기"}
              </button>

              <button
                type="button"
                onClick={() => freeQuestion.trim() && setStep(4)}
                className="h-16 rounded-2xl bg-emerald-600 px-8 text-xl font-black text-white"
              >
                AI 농장비서에게 물어보기
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-16 rounded-2xl bg-slate-100 px-8 text-xl font-black text-slate-800"
              >
                처음으로
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-emerald-700">1단계</div>
            <h2 className="mt-2 text-3xl font-black">어떤 작물을 재배하고 계십니까?</h2>
            <p className="mt-2 text-lg font-bold text-slate-600">
              작물을 알려주시면 {getConcernText(concern)} 정보를 작물에 맞게 보여드립니다.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              {crops.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCrop(c);
                    setStep(3);
                  }}
                  className="rounded-2xl border bg-slate-50 px-5 py-5 text-xl font-black hover:border-emerald-500 hover:bg-emerald-50"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-emerald-700">2단계</div>
            <h2 className="mt-2 text-3xl font-black">어느 지역에서 재배하시나요?</h2>
            <p className="mt-2 text-lg font-bold text-slate-600">
              지역을 알려주시면 날씨, 병해충 위험, 출하시기 정보를 맞춰드립니다.
            </p>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 경기 고양시, 전남 나주, 경북 영천"
                className="h-16 flex-1 rounded-2xl border px-5 text-xl font-bold"
              />
              <button
                onClick={() => region.trim() && setStep(4)}
                className="h-16 rounded-2xl bg-emerald-600 px-8 text-xl font-black text-white"
              >
                결과 보기
              </button>
            </div>
          </div>
        )}

        {step >= 4 && ready && (
          <div className="mt-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-black text-emerald-700">내 농장 AI 진단 결과</div>
              <h2 className="mt-2 text-3xl font-black">
                {concern === "free" ? "자유 농사상담 결과" : `${region} ${crop} 농가 맞춤 농사관리`}
              </h2>
              <p className="mt-2 text-lg font-bold text-slate-600">
                {concern === "free"
                  ? `질문: ${freeQuestion}`
                  : "지금은 최소 정보만으로 만든 1차 결과입니다. 추가 정보를 넣으면 농자재 수량과 작업일정이 더 정확해집니다."}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <InfoCard title="현재 생육단계" value={crop ? result.stage : "상담 필요"} />
                <InfoCard title="향후 2주 위험" value={crop ? result.warning[0] : "작물·지역 입력 시 정확도 상승"} />
                <InfoCard title="준비할 농자재" value={crop ? result.materials[0] : "상담 후 추천"} />
                <InfoCard title="추천 콘텐츠" value="영상·쇼츠 자동 추천" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Box title="이번 주 해야 할 일">
                {(crop ? result.warning : ["작물과 지역을 추가로 입력하면 맞춤 캘린더를 제공합니다.", "토양검정 자료가 있으면 업로드해 주세요.", "사진이 있으면 병해충 진단 정확도가 올라갑니다."]).map((v, i) => (
                  <div key={v} className="rounded-xl border bg-slate-50 p-4 text-lg font-black">
                    {i + 1}. {v}
                  </div>
                ))}
              </Box>

              <Box title="2주 안에 준비할 농자재">
                {(crop ? result.materials : ["생육관리 영양제 후보", "병해충 예방 자재 후보", "토양관리 자재 후보"]).map((v, i) => (
                  <div key={v} className="rounded-xl border bg-emerald-50 p-4 text-lg font-black text-emerald-800">
                    {i + 1}. {v}
                  </div>
                ))}
              </Box>

              <Box title="정확도를 높이려면">
                <input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="작물 예: 고추" className="h-14 w-full rounded-xl border px-4 text-lg font-bold" />
                <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역 예: 경기 고양시" className="h-14 w-full rounded-xl border px-4 text-lg font-bold" />
                <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="재배면적 예: 1000평" className="h-14 w-full rounded-xl border px-4 text-lg font-bold" />
                <input value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} placeholder="정식일 예: 2026-04-20" className="h-14 w-full rounded-xl border px-4 text-lg font-bold" />
              </Box>

              <Box title="다음 연결">
                <ActionButton text="토양검정 결과 업로드" sub="부족 성분과 해결책을 분석합니다." />
                <ActionButton text="추천 공동구매 보기" sub="필요한 농자재를 2주 전에 준비합니다." />
                <ActionButton text="수확예정 등록" sub="소비자·중간상·업체와 연결합니다." />
              </Box>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="text-sm font-black text-slate-500">{title}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function ActionButton({ text, sub }: { text: string; sub: string }) {
  return (
    <button className="w-full rounded-xl border bg-slate-50 p-4 text-left hover:bg-emerald-50">
      <div className="text-xl font-black">{text}</div>
      <div className="mt-1 font-bold text-slate-600">{sub}</div>
    </button>
  );
}
