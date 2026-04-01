"use client";

import { useState } from "react";

export default function ContentManagerClient({ boothId, contents }: any) {
  const [list, setList] = useState(contents);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  async function add() {
    const res = await fetch("/api/vendor/content", {
      method: "POST",
      body: JSON.stringify({ boothId, title, url }),
    });

    const json = await res.json();
    setList([json.data, ...list]);
  }

  async function remove(id: string) {
    await fetch("/api/vendor/content", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    setList(list.filter((v: any) => v.content_id !== id));
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>콘텐츠 관리</h1>

      <input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button onClick={add}>추가</button>

      {list.map((c: any) => (
        <div key={c.content_id}>
          {c.title}
          <button onClick={() => remove(c.content_id)}>삭제</button>
        </div>
      ))}
    </div>
  );
}