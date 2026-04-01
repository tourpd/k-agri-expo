"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type ChatMessage = {
  id: string | number;
  room_id: string;
  sender: string;
  message: string;
};

export default function ExpoChat({ roomId }: { roomId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("expo_chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("id", { ascending: true });

      if (!active) return;
      if (error) {
        console.error("채팅 불러오기 실패:", error.message);
        return;
      }

      setMessages((data || []) as ChatMessage[]);
    }

    loadMessages();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expo_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  async function send() {
    const message = text.trim();
    if (!message) return;

    const { error } = await supabase.from("expo_chat_messages").insert({
      room_id: roomId,
      sender: "farmer",
      message,
    });

    if (error) {
      console.error("채팅 전송 실패:", error.message);
      return;
    }

    setText("");
  }

  return (
    <div>
      <div
        style={{
          height: 200,
          overflow: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#666", fontSize: 13 }}>아직 메시지가 없습니다.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <b>{m.sender}</b> : {m.message}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 12,
          }}
        />

        <button
          onClick={send}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          보내기
        </button>
      </div>
    </div>
  );
}