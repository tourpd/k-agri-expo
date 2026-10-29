"use client";

import { useMemo, useState } from "react";

type Channel =
  | "한국농수산TV"
  | "PandaTV"
  | "K-AGRI"
  | "PV5"
  | "기업 홍보영상";

type Duration = "쇼츠" | "3분" | "10분" | "20분";

type ProgramType =
  | "현장취재"
  | "농민 성공사례"
  | "제품 검증"
  | "농법 소개"
  | "다큐멘터리"
  | "뉴스형"
  | "인터뷰"
  | "기업 홍보영상";

const channels: Channel[] = [
  "한국농수산TV",
  "PandaTV",
  "K-AGRI",
  "PV5",
  "기업 홍보영상",
];

const durations: Duration[] = ["쇼츠", "3분", "10분", "20분"];


type StoryItem = {
  section?: string;
  purpose?: string;
  content?: string;
  visual?: string;
};

type PdAnalysis = {
  materialSummary?: string;

  pdJudgement?: {
    whyNow?: string;
    audienceQuestion?: string;
    strongestPerson?: string;
    strongestNumber?: string;
    conflict?: string;
    twist?: string;
    firstFiveSeconds?: string;
  };

  titleCandidates?: string[];
  thumbnailCandidates?: string[];

  openingHook?: string;
  coreMessage?: string;

  storyStructure?: StoryItem[];

  interviewQuestions?: string[];
  shootingChecklist?: string[];
  warnings?: string[];

  ending?: string;
};

const programTypes: ProgramType[] = [
  "현장취재",
  "농민 성공사례",
  "제품 검증",
  "농법 소개",
  "다큐멘터리",
  "뉴스형",
  "인터뷰",
  "기업 홍보영상",
];

export default function StudioPage() {
  const [channel, setChannel] =
    useState<Channel>("한국농수산TV");

  const [duration, setDuration] =
    useState<Duration>("10분");

  const [programType, setProgramType] =
    useState<ProgramType>("현장취재");

  const [sourceUrl, setSourceUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showResult, setShowResult] = useState(false);

  const [analysis, setAnalysis] =
    useState<PdAnalysis | null>(null);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");

  const fileSummary = useMemo(() => {
    if (files.length === 0) return "선택된 파일 없음";
    if (files.length === 1) return files[0].name;
    return `${files[0].name} 외 ${files.length - 1}개`;
  }, [files]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const newFiles = Array.from(
      event.target.files ?? [],
    );

    setFiles((current) => {
      const combined = [
        ...current,
        ...newFiles,
      ];

      // 같은 파일 중복 등록 방지
      return combined.filter(
        (file, index, array) =>
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified ===
                file.lastModified,
          ) === index,
      );
    });

    // 같은 파일을 삭제 후 다시 선택할 수 있도록 초기화
    event.target.value = "";
  }

  function removeFile(indexToRemove: number) {
    setFiles((current) =>
      current.filter(
        (_, index) =>
          index !== indexToRemove,
      ),
    );
  }

  function clearFiles() {
    setFiles([]);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  }

  async function handleCreateBroadcast() {
    if (
      !memo.trim() &&
      !sourceUrl.trim() &&
      files.length === 0
    ) {
      setAnalysisError(
        "방송 자료, URL 또는 조PD 추가 지시 중 하나는 입력해 주세요.",
      );
      setShowResult(true);
      setAnalysis(null);

      setTimeout(() => {
        document
          .getElementById("pd-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);

      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    setShowResult(true);

    setTimeout(() => {
      document
        .getElementById("pd-result")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);

    try {
      const response = await fetch(
        "/api/studio/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            channel,
            duration,
            programType,
            sourceUrl,
            memo,
            fileNames: files.map(
              (file) => file.name,
            ),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "AI 방송 분석에 실패했습니다.",
        );
      }

      setAnalysis(data.analysis);
    } catch (error) {
      console.error(
        "[JOPD STUDIO]",
        error,
      );

      setAnalysisError(
        error instanceof Error
          ? error.message
          : "AI 방송 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f4f1",
        color: "#171717",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif',
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            padding: "26px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#777",
              }}
            >
              JOPD AI STUDIO
            </div>

            <h1
              style={{
                margin: "5px 0 0",
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              조PD AI 방송국
            </h1>
          </div>

          <div
            style={{
              background: "#eee",
              padding: "11px 16px",
              fontWeight: 800,
            }}
          >
            방송 기획 엔진 · MVP 1
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: 32,
        }}
      >
        <section
          style={{
            background: "#111",
            color: "#fff",
            padding: 32,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: "#aaa",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            자료 → 판단 → 기획 → 대본 → 영상
          </div>

          <h2
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              margin: "10px 0",
            }}
          >
            무엇을 찍을지 고민하지 마세요.
            <br />
            자료부터 넣으세요.
          </h2>

          <p
            style={{
              color: "#ccc",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            조PD AI 방송국이 소재의 핵심, 인물, 숫자,
            갈등과 훅을 찾아 방송 구조를 설계합니다.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) minmax(320px,420px)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div>
            <Section title="1. 어느 채널에 방송할까요?">
              <div style={gridStyle}>
                {channels.map((item) => (
                  <Choice
                    key={item}
                    active={channel === item}
                    onClick={() => setChannel(item)}
                  >
                    {item}
                  </Choice>
                ))}
              </div>
            </Section>

            <Section title="2. 방송 자료를 넣어주세요">
              <p style={{ color: "#666" }}>
                기사 · PDF · 사진 · 촬영영상 · 음성 ·
                메모를 한꺼번에 넣을 수 있습니다.
              </p>

              <label
                style={{
                  marginTop: 20,
                  minHeight: 220,
                  border: "2px dashed #bbb",
                  background: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#111",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                  }}
                >
                  +
                </div>

                <strong
                  style={{
                    marginTop: 15,
                    fontSize: 20,
                  }}
                >
                  파일 추가
                </strong>

                <span
                  style={{
                    marginTop: 8,
                    color: "#777",
                  }}
                >
                  PDF · 사진 · 영상 · 음성
                </span>

                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept=".pdf,.txt,.doc,.docx,image/*,video/*,audio/*"
                />
              </label>

              <div
                style={{
                  marginTop: 12,
                  background: "#eee",
                  padding: 14,
                }}
              >
                {files.length === 0 ? (
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#666",
                    }}
                  >
                    선택된 파일 없음
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <strong>
                        선택된 파일 {files.length}개
                      </strong>

                      <button
                        type="button"
                        onClick={clearFiles}
                        style={{
                          border:
                            "1px solid #bbb",
                          background: "#fff",
                          padding:
                            "8px 12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        전체 삭제
                      </button>
                    </div>

                    {files.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "minmax(0,1fr) auto",
                            gap: 12,
                            alignItems:
                              "center",
                            background:
                              "#fff",
                            borderTop:
                              index === 0
                                ? "none"
                                : "1px solid #ddd",
                            padding:
                              "12px 14px",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  800,
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                              title={
                                file.name
                              }
                            >
                              {file.name}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  4,
                                color:
                                  "#777",
                                fontSize:
                                  13,
                              }}
                            >
                              {formatFileSize(
                                file.size,
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFile(
                                index,
                              )
                            }
                            aria-label={`${file.name} 삭제`}
                            style={{
                              border:
                                "1px solid #bbb",
                              background:
                                "#fff",
                              color:
                                "#111",
                              minWidth:
                                64,
                              padding:
                                "9px 12px",
                              fontWeight:
                                900,
                              cursor:
                                "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      ),
                    )}
                  </>
                )}
              </div>

              <label style={labelStyle}>
                유튜브 / 기사 / 홈페이지 URL
              </label>

              <input
                value={sourceUrl}
                onChange={(e) =>
                  setSourceUrl(e.target.value)
                }
                placeholder="https://"
                style={inputStyle}
              />

              <label style={labelStyle}>
                조PD 추가 지시
              </label>

              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={6}
                placeholder="예: 농민이 실제로 얼마나 돈을 버는지 중심으로 구성해. 가장 강한 숫자를 앞에 배치해."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
              />
            </Section>

            <Section title="3. 영상 길이를 선택하세요">
              <div style={gridStyle}>
                {durations.map((item) => (
                  <Choice
                    key={item}
                    active={duration === item}
                    onClick={() => setDuration(item)}
                  >
                    {item}
                  </Choice>
                ))}
              </div>
            </Section>

            <Section title="4. 어떤 방송으로 만들까요?">
              <div style={gridStyle}>
                {programTypes.map((item) => (
                  <Choice
                    key={item}
                    active={programType === item}
                    onClick={() => setProgramType(item)}
                  >
                    {item}
                  </Choice>
                ))}
              </div>
            </Section>

            <button
              type="button"
              onClick={handleCreateBroadcast}
              style={{
                width: "100%",
                border: 0,
                background: "#111",
                color: "#fff",
                padding: 22,
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {isAnalyzing
                ? "조PD가 방송을 판단하고 있습니다..."
                : "방송 만들기 →"}
            </button>
          </div>

          <aside
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              padding: 24,
              position: "sticky",
              top: 20,
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              JOPD PD ENGINE
            </div>

            <h2 style={{ fontSize: 24 }}>
              방송 전에 먼저 판단
            </h2>

            {[
              "이 소재를 왜 지금 방송해야 하는가?",
              "시청자가 가장 궁금해할 것은 무엇인가?",
              "가장 강한 인물은 누구인가?",
              "가장 강한 숫자는 무엇인가?",
              "문제와 갈등은 무엇인가?",
              "반전은 무엇인가?",
              "첫 5초에 무엇을 보여줄 것인가?",
              "현장에서 무엇을 추가로 찍어야 하는가?",
            ].map((text, index) => (
              <div
                key={text}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #eee",
                  display: "grid",
                  gridTemplateColumns: "35px 1fr",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    color: "#999",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <strong
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {text}
                </strong>
              </div>
            ))}

            <div
              style={{
                marginTop: 22,
                padding: 18,
                background: "#eee",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              {channel}
              <br />
              {duration} · {programType}
            </div>
          </aside>
        </div>

        {showResult && (
          <section
            id="pd-result"
            style={{
              marginTop: 32,
              background: "#fff",
              border: "1px solid #ddd",
              padding: 28,
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              JOPD PD ENGINE · AI ANALYSIS
            </div>

            <h2
              style={{
                fontSize: 30,
                marginBottom: 8,
              }}
            >
              방송 기획 결과
            </h2>

            <p
              style={{
                color: "#666",
                marginTop: 0,
                marginBottom: 28,
              }}
            >
              {channel} · {duration} · {programType}
            </p>

            {isAnalyzing && (
              <div
                style={{
                  background: "#111",
                  color: "#fff",
                  padding: 30,
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1.7,
                }}
              >
                조PD AI가 자료를 읽고 있습니다.
                <br />
                인물 · 숫자 · 갈등 · 반전 · 첫 장면을
                판단하는 중입니다...
              </div>
            )}

            {!isAnalyzing &&
              analysisError && (
                <div
                  style={{
                    padding: 22,
                    background: "#fff2f2",
                    border: "1px solid #d88",
                    color: "#8b0000",
                    fontWeight: 800,
                    lineHeight: 1.7,
                  }}
                >
                  분석 오류
                  <br />
                  {analysisError}
                </div>
              )}

            {!isAnalyzing &&
              analysis && (
                <>
                  <AnalysisBox
                    number="01"
                    title="소재 핵심"
                  >
                    {analysis.materialSummary ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <AnalysisBox
                    number="02"
                    title="왜 지금 방송해야 하는가?"
                  >
                    {analysis.pdJudgement
                      ?.whyNow ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <AnalysisBox
                    number="03"
                    title="시청자가 가장 궁금해할 것"
                  >
                    {analysis.pdJudgement
                      ?.audienceQuestion ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(240px,1fr))",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <MiniAnalysis
                      label="가장 강한 인물"
                      value={
                        analysis.pdJudgement
                          ?.strongestPerson
                      }
                    />

                    <MiniAnalysis
                      label="가장 강한 숫자"
                      value={
                        analysis.pdJudgement
                          ?.strongestNumber
                      }
                    />

                    <MiniAnalysis
                      label="문제와 갈등"
                      value={
                        analysis.pdJudgement
                          ?.conflict
                      }
                    />

                    <MiniAnalysis
                      label="반전"
                      value={
                        analysis.pdJudgement
                          ?.twist
                      }
                    />
                  </div>

                  <AnalysisBox
                    number="04"
                    title="첫 5초"
                    dark
                  >
                    {analysis.pdJudgement
                      ?.firstFiveSeconds ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <AnalysisBox
                    number="05"
                    title="오프닝 훅"
                  >
                    {analysis.openingHook ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <AnalysisBox
                    number="06"
                    title="이 방송의 핵심 한 문장"
                  >
                    {analysis.coreMessage ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>

                  <ResultList
                    number="07"
                    title="유튜브 제목 후보"
                    items={
                      analysis.titleCandidates
                    }
                  />

                  <ResultList
                    number="08"
                    title="썸네일 문구"
                    items={
                      analysis.thumbnailCandidates
                    }
                  />

                  <div
                    style={{
                      marginTop: 30,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#777",
                        fontWeight: 900,
                      }}
                    >
                      09 · STORY STRUCTURE
                    </div>

                    <h3
                      style={{
                        fontSize: 24,
                        marginTop: 7,
                      }}
                    >
                      방송 전체 구성
                    </h3>

                    {(analysis.storyStructure ||
                      []).map(
                      (item, index) => (
                        <div
                          key={`${item.section}-${index}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "60px minmax(100px,160px) 1fr",
                            gap: 16,
                            padding: "18px 0",
                            borderTop:
                              "1px solid #ddd",
                          }}
                        >
                          <strong>
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </strong>

                          <div>
                            <strong>
                              {item.section ||
                                "구간"}
                            </strong>

                            <div
                              style={{
                                marginTop: 5,
                                color: "#777",
                                fontSize: 13,
                              }}
                            >
                              {item.purpose}
                            </div>
                          </div>

                          <div
                            style={{
                              lineHeight: 1.7,
                            }}
                          >
                            {item.content}

                            {item.visual && (
                              <div
                                style={{
                                  marginTop: 8,
                                  color: "#666",
                                  fontSize: 14,
                                }}
                              >
                                화면:{" "}
                                {item.visual}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <ResultList
                    number="10"
                    title="인터뷰 질문"
                    items={
                      analysis.interviewQuestions
                    }
                  />

                  <ResultList
                    number="11"
                    title="현장 추가 촬영"
                    items={
                      analysis.shootingChecklist
                    }
                  />

                  <ResultList
                    number="12"
                    title="확인·검증 필요"
                    items={analysis.warnings}
                  />

                  <AnalysisBox
                    number="13"
                    title="엔딩"
                    dark
                  >
                    {analysis.ending ||
                      "자료에서 확인되지 않음"}
                  </AnalysisBox>
                </>
              )}
          </section>
        )}
      </div>
    </main>
  );
}


function AnalysisBox({
  number,
  title,
  children,
  dark = false,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: 22,
        background: dark
          ? "#111"
          : "#f5f5f2",
        color: dark ? "#fff" : "#111",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: dark ? "#aaa" : "#777",
          fontWeight: 900,
        }}
      >
        {number}
      </div>

      <h3
        style={{
          fontSize: 20,
          margin: "6px 0 10px",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          lineHeight: 1.8,
          fontSize: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MiniAnalysis({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 18,
        minHeight: 120,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: 12,
          fontWeight: 900,
          marginBottom: 9,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          lineHeight: 1.7,
        }}
      >
        {value ||
          "자료에서 확인되지 않음"}
      </strong>
    </div>
  );
}

function ResultList({
  number,
  title,
  items,
}: {
  number: string;
  title: string;
  items?: string[];
}) {
  return (
    <div
      style={{
        marginTop: 30,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {number}
      </div>

      <h3
        style={{
          fontSize: 22,
          margin: "6px 0 10px",
        }}
      >
        {title}
      </h3>

      {items && items.length > 0 ? (
        items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns:
                "40px 1fr",
              gap: 12,
              borderTop:
                "1px solid #ddd",
              padding: "14px 0",
              lineHeight: 1.7,
            }}
          >
            <strong>
              {String(index + 1).padStart(
                2,
                "0",
              )}
            </strong>

            <span>{item}</span>
          </div>
        ))
      ) : (
        <div
          style={{
            padding: "14px 0",
            borderTop: "1px solid #ddd",
            color: "#777",
          }}
        >
          자료에서 확인되지 않음
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        padding: 28,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          fontSize: 22,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 58,
        border: active
          ? "1px solid #111"
          : "1px solid #ccc",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        padding: 12,
        fontSize: 16,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Result({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "150px 1fr",
        gap: 20,
        padding: "15px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: 24,
  marginBottom: 8,
  fontWeight: 900,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  background: "#fff",
  color: "#111",
  padding: 15,
  fontSize: 16,
};
