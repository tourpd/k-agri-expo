"use client"

import { useState } from "react"

export default function KHOSFollowup({ result }: any) {
  const [question, setQuestion] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function askAgain() {
    if (!question.trim()) return

    setLoading(true)

    const res = await fetch("/api/khos-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: result, question })
    })

    const data = await res.json()

    setHistory(prev => [
      ...prev,
      {
        question,
        answer: data.answer || "응답 없음"
      }
    ])

    setQuestion("")
    setLoading(false)
  }

  return (
    <section style={box}>
      <h2>12. K-HOS 추가 탐구</h2>
      <p>분석 결과를 바탕으로 더 파고들 질문을 입력하세요.</p>

      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="예: 이걸 웅쌤 세계관과 연결해줘 / 유튜브 10부작으로 만들어줘 / 사업모델만 다시 뽑아줘"
        style={textarea}
      />

      <button onClick={askAgain} disabled={loading} style={button}>
        {loading ? "K-HOS 재해석 중..." : "K-HOS에게 다시 묻기"}
      </button>

      {history.map((h, i) => (
        <div key={i} style={resultBox}>
          <h3>추가 재해석 #{i + 1}</h3>
          <b>질문</b>
          <p>{h.question}</p>
          <b>K-HOS 답변</b>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {h.answer}
          </div>
        </div>
      ))}
    </section>
  )
}

const box = {
  background: "#fff",
  padding: 25,
  marginBottom: 25,
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,.1)"
}

const textarea = {
  width: "100%",
  minHeight: 130,
  padding: 16,
  border: "1px solid #ccc",
  borderRadius: 8,
  marginBottom: 15
}

const button = {
  background: "#2563eb",
  color: "#fff",
  border: 0,
  padding: "16px 30px",
  borderRadius: 10,
  fontWeight: "bold"
}

const resultBox = {
  marginTop: 25,
  background: "#f8fafc",
  borderLeft: "5px solid #2563eb",
  padding: 20,
  borderRadius: 10
}
