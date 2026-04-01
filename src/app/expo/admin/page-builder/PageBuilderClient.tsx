"use client";

import { useState } from "react";

type PageRow = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
};

type BlockRow = {
  id: string | number;
  block_type: string;
  sort_order?: number | null;
};

type Props = {
  page: PageRow;
  blocks: BlockRow[];
};

export default function PageBuilderClient({ page, blocks }: Props) {
  const [blockList, setBlockList] = useState<BlockRow[]>(blocks);

  async function createBlock(type: string) {
    const res = await fetch("/api/expo/admin/block-create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_id: page.id,
        block_type: type,
      }),
    });

    const block: BlockRow = await res.json();

    setBlockList([...blockList, block]);
  }

  async function deleteBlock(id: string | number) {
    await fetch("/api/expo/admin/block-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    setBlockList(blockList.filter((b) => b.id !== id));
  }

  async function moveBlock(id: string | number, dir: "up" | "down") {
    await fetch("/api/expo/admin/block-move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        direction: dir,
      }),
    });

    location.reload();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28 }}>메인페이지 블록 편성</h1>

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => createBlock("hero_video")}>HERO 영상 추가</button>

        <button onClick={() => createBlock("grand_prize_banner")}>
          경품 이벤트
        </button>

        <button onClick={() => createBlock("deal_grid")}>농민 특가 4칸</button>

        <button onClick={() => createBlock("live_banner")}>라이브 방송</button>

        <button onClick={() => createBlock("featured_booths")}>추천 부스</button>
      </div>

      <div style={{ marginTop: 40 }}>
        {blockList.map((block, i) => (
          <div
            key={block.id}
            style={{
              border: "1px solid #ddd",
              padding: 20,
              marginBottom: 20,
              borderRadius: 12,
            }}
          >
            <h3>
              {i + 1}. {block.block_type}
            </h3>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => moveBlock(block.id, "up")}>↑ 위로</button>

              <button onClick={() => moveBlock(block.id, "down")}>↓ 아래로</button>

              <button
                onClick={() => deleteBlock(block.id)}
                style={{ color: "red" }}
              >
                삭제
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <a href={`/expo/admin/block/${block.id}`}>블록 편집 →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}