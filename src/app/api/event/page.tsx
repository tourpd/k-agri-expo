"use client";

import { useState } from "react";

type Winner = {
  name: string;
  phone: string;
};

export default function AdminEvent() {
  const [winner, setWinner] = useState<Winner | null>(null);

  const draw = async () => {
    const res = await fetch("/api/event/draw");
    const data = await res.json();

    if (data && data.name) {
      setWinner(data);
    }
  };

  return (
    <div>
      <h1>이벤트 추첨</h1>

      <button onClick={draw}>랜덤 추첨</button>

      {winner ? (
        <div>
          <h2>당첨자</h2>
          <p>{winner.name}</p>
          <p>{winner.phone}</p>
        </div>
      ) : null}
    </div>
  );
}