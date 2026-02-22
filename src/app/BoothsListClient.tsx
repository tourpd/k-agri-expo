"use client";

import { useEffect, useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Booth = {
  booth_id: string;
  name: string | null;
  region: string | null;
  created_at: string;
};

export default function BoothsListClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setBooths(data as Booth[]);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) return <p>불러오는 중...</p>;
  if (!booths.length) return <p>아직 등록된 부스가 없습니다.</p>;

  return (
    <ul>
      {booths.map((b) => (
        <li key={b.booth_id}>
          <a href={`/booth/${b.booth_id}`}>
            <strong>{b.name || "이름 없음"}</strong> — {b.region || "지역 미입력"}
          </a>
        </li>
      ))}
    </ul>
  );
}