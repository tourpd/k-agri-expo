"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createClient,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from "@supabase/supabase-js";

type ChatMessage = {
  id: string;
  room_id: string;
  user_id: string | null;
  message: string;
  created_at: string;
};

function createBrowserSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anonKey);
}

export default function ExpoChat({ roomId }: { roomId: string }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("expo_chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error("[ExpoChat] loadMessages error:", error);
        return;
      }

      setMessages((data ?? []) as ChatMessage[]);
    }

    void loadMessages();

    const channel = supabase
      .channel(`expo-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expo_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  async function handleSend() {
    const message = text.trim();
    if (!message) return;

    const { error } = await supabase.from("expo_chat_messages").insert({
      room_id: roomId,
      message,
    });

    if (error) {
      console.error("[ExpoChat] send error:", error);
      return;
    }

    setText("");
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user_id ?? "익명"}</strong>: {msg.message}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={handleSend}>
          보내기
        </button>
      </div>
    </div>
  );
}