"use client";

import { useState } from "react";

type Item = {
  id: number;
  type: "아이디어" | "음성" | "인터뷰" | "명언" | "연재";
  title: string;
  memo: string;
  status: "대기" | "분석중" | "정리완료" | "제작중";
  output: string;
};

export const dynamic = "force-dynamic";

export default function CreativeRoomPage() {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [step, setStep] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewItem, setViewItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<
    "원문" | "시간대별" | "주제별" | "명언금고" | "비고" | "AI대화"
  >("원문");

  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      type: "아이디어",
      title: "손주와 여행",
      memo: "무릎 때문에 약속을 못 지키는 할아버지 이야기",
      status: "대기",
      output: "",
    },
    {
      id: 2,
      type: "아이디어",
      title: "옆집은 멀쩡한데",
      memo: "옆집 밭만 잘되는 이유를 궁금해하는 농부 이야기",
      status: "대기",
      output: "",
    },
    {
      id: 3,
      type: "인터뷰",
      title: "정명수 대표의 15년",
      memo: "곤충에 인생을 건 미래식량 개척자 이야기",
      status: "대기",
      output: "",
    },
  ]);

  function addIdea() {
    if (!title.trim() && !memo.trim()) return;

    setItems((prev) => [
      {
        id: Date.now(),
        type: "아이디어",
        title: title.trim() || "제목 없는 아이디어",
        memo: memo.trim() || "메모 없음",
        status: "대기",
        output: "",
      },
      ...prev,
    ]);

    setTitle("");
    setMemo("");
  }

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function deleteSelected() {
    setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  }

  function deleteOne(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function changeStatus(id: number, status: Item["status"]) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  function openView(item: Item) {
    setViewItem(item);
    setActiveTab("원문");
  }

  async function analyzeAudio() {
    if (!audioFile) {
      alert("음성 파일을 먼저 선택하십시오.");
      return;
    }

    const newId = Date.now();

    setItems((prev) => [
      {
        id: newId,
        type: "음성",
        title: audioFile.name,
        memo: "음성 업로드됨. 글자 변환 대기",
        status: "분석중",
        output: "",
      },
      ...prev,
    ]);

    try {
      setStep("1단계: 음성파일 업로드 중...");

      const formData = new FormData();
      formData.append("file", audioFile);

      setStep("2단계: 음성을 글자로 변환 중...");

      const res = await fetch("/api/creative-room/transcribe", {
        method: "POST",
        body: formData,
      });

      setStep("3단계: 작가노트로 정리 중...");

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStep("분석 실패");
        setItems((prev) =>
          prev.map((item) =>
            item.id === newId
              ? {
                  ...item,
                  status: "대기",
                  memo: data.message || "음성 분석 실패",
                }
              : item
          )
        );
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === newId
            ? {
                ...item,
                status: "정리완료",
                memo: "음성 글자 변환 및 작가노트 정리 완료",
                output:
                  "[원문 녹취록]\n\n" +
                  (data.transcript || "") +
                  "\n\n━━━━━━━━━━━━━━\n[AI 작가노트]\n━━━━━━━━━━━━━━\n" +
                  (data.summary || ""),
              }
            : item
        )
      );

      setStep("완료: 음성 금고에 정리되었습니다.");
    } catch (error) {
      console.error(error);
      setStep("오류: 음성 분석 중 문제가 발생했습니다.");
    }
  }

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <div style={styles.kicker}>K-Agri Content OS</div>
        <h1 style={styles.h1}>콘텐츠 자산실</h1>
        <p style={styles.heroText}>
          아이디어·음성·인터뷰를 기록하고, 원문·시간대별 정리·주제별 정리·명언금고·비고·AI대화로 관리합니다.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>새 자료 등록</h2>

        <div style={styles.formGrid}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목: 예) 손주와 여행"
            style={styles.input}
          />

          <button onClick={addIdea} style={styles.greenButton}>
            + 아이디어 추가
          </button>
        </div>

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모: 예) 오늘 시골 가다가 생각났는데..."
          rows={5}
          style={styles.textarea}
        />

        <div style={styles.formGrid}>
          <input
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.aac"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            style={styles.input}
          />

          <button onClick={analyzeAudio} style={styles.blueButton}>
            🎤 음성 분석 시작
          </button>
        </div>

        {audioFile ? <p style={styles.fileName}>선택됨: {audioFile.name}</p> : null}
        {step ? <div style={styles.stepBox}>{step}</div> : null}
      </section>

      <section style={styles.card}>
        <div style={styles.toolbar}>
          <h2 style={styles.h2}>작가실 자료 목록</h2>

          <div style={styles.toolbarButtons}>
            <button style={styles.blackButton}>콘텐츠 생성</button>
            <button style={styles.blackButton}>AI와 대화</button>
            <button style={styles.redButton} onClick={deleteSelected}>
              선택 삭제
            </button>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>선택</Th>
                <Th>유형</Th>
                <Th>상태</Th>
                <Th>제목</Th>
                <Th>메모</Th>
                <Th>문서</Th>
                <Th>액션</Th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                  </Td>
                  <Td>{item.type}</Td>
                  <Td>
                    <span style={badge(item.status)}>{item.status}</span>
                  </Td>
                  <Td>
                    <b>{item.title}</b>
                  </Td>
                  <Td>{item.memo}</Td>
                  <Td>
                    <button
                      onClick={() => openView(item)}
                      style={item.output ? styles.smallGreen : styles.smallGray}
                    >
                      문서 보기
                    </button>
                  </Td>
                  <Td>
                    <div style={styles.rowButtons}>
                      <button
                        onClick={() => changeStatus(item.id, "제작중")}
                        style={styles.smallGreen}
                      >
                        제작
                      </button>
                      <button style={styles.smallBlue}>콘텐츠</button>
                      <button style={styles.smallBlue}>AI대화</button>
                      <button
                        onClick={() => deleteOne(item.id)}
                        style={styles.smallRed}
                      >
                        삭제
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {viewItem ? (
        <section style={styles.viewer}>
          <div style={styles.viewerHeader}>
            <div>
              <p style={styles.kickerDark}>문서 보기</p>
              <h2 style={styles.h2}>{viewItem.title}</h2>
              <p style={styles.viewerMemo}>{viewItem.memo}</p>
            </div>
            <button onClick={() => setViewItem(null)} style={styles.redButton}>
              닫기
            </button>
          </div>

          <div style={styles.tabWrap}>
            {(["원문", "시간대별", "주제별", "명언금고", "비고", "AI대화"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={activeTab === tab ? styles.activeTab : styles.tab}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div style={styles.documentBox}>
            <DocumentContent item={viewItem} tab={activeTab} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DocumentContent({
  item,
  tab,
}: {
  item: Item;
  tab: "원문" | "시간대별" | "주제별" | "명언금고" | "비고" | "AI대화";
}) {
  const output = item.output || "아직 정리된 문서가 없습니다.";

  if (tab === "원문") {
    return <pre style={styles.docPre}>{output}</pre>;
  }

  if (tab === "시간대별") {
    return (
      <div>
        <h3 style={styles.h3}>시간대별 대화 기록</h3>
        <p style={styles.docText}>
          다음 단계에서 AI가 원문을 00:00~05:00, 05:00~10:00처럼 나누어 시간대별 핵심 대화를 정리합니다.
        </p>
        <pre style={styles.docPre}>{output}</pre>
      </div>
    );
  }

  if (tab === "주제별") {
    return (
      <div>
        <h3 style={styles.h3}>주제별 정리</h3>
        <p style={styles.docText}>
          가격, 농가문제, 제품, 인물, 미래식량, 치유농업처럼 주제별로 다시 묶는 공간입니다.
        </p>
        <pre style={styles.docPre}>{output}</pre>
      </div>
    );
  }

  if (tab === "명언금고") {
    return (
      <div>
        <h3 style={styles.h3}>명언금고</h3>
        <p style={styles.docText}>
          대화 중 철학이 있는 말, 고객에게 울림 있는 말, 영상 제목이 될 만한 말을 모으는 공간입니다.
        </p>
        <pre style={styles.docPre}>{output}</pre>
      </div>
    );
  }

  if (tab === "비고") {
    return (
      <div>
        <h3 style={styles.h3}>비고 / 기타</h3>
        <textarea
          placeholder="대표님 메모: 이 부분은 감동형으로, 이 말은 제목 후보, 이 사람은 다시 인터뷰..."
          style={styles.noteArea}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 style={styles.h3}>AI와 대화</h3>
      <textarea
        placeholder="예: 이성준 회장 가격 이야기만 뽑아줘 / 이걸 8컷 웹툰으로 만들어줘 / 교육자료로 바꿔줘"
        style={styles.noteArea}
      />
      <button style={styles.greenButton}>AI 작가에게 요청</button>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={styles.td}>{children}</td>;
}

function badge(status: Item["status"]): React.CSSProperties {
  const bg =
    status === "정리완료"
      ? "#dcfce7"
      : status === "분석중"
      ? "#dbeafe"
      : status === "제작중"
      ? "#fef9c3"
      : "#f1f5f9";

  return {
    display: "inline-block",
    background: bg,
    border: "2px solid #000",
    borderRadius: "999px",
    padding: "6px 12px",
    fontWeight: 900,
  };
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f4f7f2",
    color: "#000",
    padding: "32px",
    fontFamily: "system-ui, Apple SD Gothic Neo, sans-serif",
  },
  hero: {
    maxWidth: "1500px",
    margin: "0 auto",
    background: "#000",
    color: "#fff",
    borderRadius: "28px",
    padding: "40px",
  },
  kicker: { color: "#86efac", fontSize: 22, fontWeight: 900 },
  kickerDark: { color: "#15803d", fontSize: 20, fontWeight: 900, margin: 0 },
  h1: { margin: "12px 0 0", fontSize: 56, fontWeight: 950 },
  h2: { margin: 0, fontSize: 38, fontWeight: 950 },
  h3: { margin: "8px 0 12px", fontSize: 28, fontWeight: 950 },
  heroText: { marginTop: 18, fontSize: 24, fontWeight: 800 },
  card: {
    maxWidth: "1500px",
    margin: "28px auto 0",
    background: "#fff",
    borderRadius: 28,
    padding: 32,
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: 16,
    marginTop: 20,
  },
  input: {
    border: "3px solid #000",
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    fontWeight: 900,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 16,
    border: "3px solid #000",
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    fontWeight: 800,
  },
  greenButton: button("#15803d"),
  blueButton: button("#1d4ed8"),
  blackButton: button("#000"),
  redButton: button("#be123c"),
  fileName: { fontSize: 18, fontWeight: 900, color: "#15803d" },
  stepBox: {
    marginTop: 18,
    background: "#ecfdf5",
    border: "3px solid #15803d",
    borderRadius: 18,
    padding: 18,
    fontSize: 22,
    fontWeight: 900,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  toolbarButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  tableWrap: { marginTop: 24, overflowX: "auto" },
  table: {
    width: "100%",
    minWidth: 1300,
    borderCollapse: "collapse",
    border: "3px solid #000",
  },
  th: {
    background: "#111",
    color: "#fff",
    padding: 14,
    fontSize: 18,
    textAlign: "left",
    border: "2px solid #000",
  },
  td: {
    padding: 14,
    fontSize: 17,
    fontWeight: 700,
    border: "2px solid #000",
    verticalAlign: "top",
  },
  rowButtons: { display: "flex", gap: 8, flexWrap: "wrap" },
  smallGreen: smallButton("#15803d"),
  smallBlue: smallButton("#1d4ed8"),
  smallRed: smallButton("#dc2626"),
  smallGray: smallButton("#6b7280"),
  viewer: {
    maxWidth: "1500px",
    margin: "28px auto 0",
    background: "#fff",
    border: "4px solid #000",
    borderRadius: 28,
    padding: 32,
  },
  viewerHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  viewerMemo: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 800,
    color: "#444",
  },
  tabWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 24,
  },
  tab: {
    background: "#e5e7eb",
    color: "#000",
    border: "2px solid #000",
    borderRadius: 14,
    padding: "12px 18px",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
  },
  activeTab: {
    background: "#15803d",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: 14,
    padding: "12px 18px",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
  },
  documentBox: {
    marginTop: 20,
    background: "#f8fafc",
    border: "3px solid #000",
    borderRadius: 20,
    padding: 24,
  },
  docPre: {
    whiteSpace: "pre-wrap",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.65,
    maxHeight: 600,
    overflow: "auto",
  },
  docText: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.5,
    color: "#444",
  },
  noteArea: {
    width: "100%",
    minHeight: 180,
    boxSizing: "border-box",
    border: "3px solid #000",
    borderRadius: 16,
    padding: 18,
    fontSize: 19,
    fontWeight: 800,
    marginBottom: 16,
  },
};

function button(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: 0,
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 19,
    fontWeight: 950,
    cursor: "pointer",
  };
}

function smallButton(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: 0,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  };
}
