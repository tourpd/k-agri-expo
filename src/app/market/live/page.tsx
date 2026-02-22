// src/app/market/live/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ui, Btn, Card } from "@/lib/ui";

type LiveLinkRow = {
  id?: string;
  booth_id?: string | null;
  type?: string | null; // "live"
  url?: string | null;
  title?: string | null;
  created_at?: string | null;
};

type BoothRow = {
  booth_id: string;
  name: string | null;
  region: string | null;
  intro: string | null;
  category_l1: string | null;
  category_l2: string | null;
};

type ProductRow = {
  product_id: string;
  booth_id: string;
  name: string | null;
  category: string | null;
  price_type?: string | null; // fixed | inquiry
  price?: number | null;

  // LIVE 특판용 (있으면 표시)
  is_live?: boolean | null;
  live_price?: string | null;
  live_until?: string | null;

  buy_url?: string | null;
  image_url?: string | null;
  description?: string | null;
  created_at?: string | null;
};

function toYouTubeEmbedUrl(url: string) {
  // youtu.be/xxxx
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

  // youtube.com/watch?v=xxxx
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

  // 이미 embed면 그대로
  if (url.includes("/embed/")) return url;

  // 그 외는 그냥 url 반환(혹시 다른 플랫폼이면 링크 열기)
  return url;
}

function fmtWon(n: any) {
  if (n == null || n === "") return null;
  const v = typeof n === "number" ? n : Number(String(n).replace(/,/g, ""));
  if (!Number.isFinite(v)) return String(n);
  return `${v.toLocaleString("ko-KR")}원`;
}

function isFuture(iso?: string | null) {
  if (!iso) return true; // live_until 없으면 계속 노출
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t > Date.now() : true;
}

export default function LiveMarketPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [live, setLive] = useState<LiveLinkRow | null>(null);
  const [liveBooth, setLiveBooth] = useState<BoothRow | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [boothMap, setBoothMap] = useState<Record<string, BoothRow>>({});

  // 상담/대량구매 간단 폼(선택)
  const [inqName, setInqName] = useState("");
  const [inqPhone, setInqPhone] = useState("");
  const [inqText, setInqText] = useState("");
  const [inqBusy, setInqBusy] = useState(false);
  const [inqOk, setInqOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      // 1) LIVE 링크 최신 1개 가져오기
      // - content_links 테이블에 type="live"가 있으면 그걸 사용
      // - 만약 type 컬럼이 없다면, 아래 .eq("type","live")에서 에러가 날 수 있으니
      //   그 경우를 대비해 "그냥 최신 1개"로 fallback 합니다.
      let liveRow: LiveLinkRow | null = null;

      // 시도 A: type="live"
      const tryA = await supabase
        .from("content_links")
        .select("*")
        .eq("type", "live")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!tryA.error && tryA.data && tryA.data.length > 0) {
        liveRow = tryA.data[0] as LiveLinkRow;
      } else {
        // 시도 B: 그냥 최신 1개 (type이 없는 스키마 대비)
        const tryB = await supabase
          .from("content_links")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!tryB.error && tryB.data && tryB.data.length > 0) {
          liveRow = tryB.data[0] as LiveLinkRow;
        }
      }

      setLive(liveRow);

      // 2) LIVE 부스 정보(있다면)
      if (liveRow?.booth_id) {
        const { data: b, error: bErr } = await supabase
          .from("booths")
          .select("booth_id,name,region,intro,category_l1,category_l2")
          .eq("booth_id", liveRow.booth_id)
          .single();

        if (!bErr && b) setLiveBooth(b as BoothRow);
      }

      // 3) LIVE 특판 제품 가져오기
      // 우선순위: is_live = true + (live_until이 미래거나 null)
      const { data: ps, error: pErr } = await supabase
        .from("products")
        .select("*")
        .eq("is_live", true)
        .order("created_at", { ascending: false })
        .limit(60);

      if (pErr) {
        // is_live 컬럼이 아직 없으면 여기서 에러가 날 수 있음
        setProducts([]);
      } else {
        const list = (ps as ProductRow[]) ?? [];
        const filtered = list.filter((p) => isFuture(p.live_until ?? null));
        setProducts(filtered);

        // 4) 제품에 매칭되는 부스 이름 보여주기 위해 booths 로딩
        const boothIds = Array.from(new Set(filtered.map((p) => p.booth_id))).filter(Boolean);
        if (boothIds.length > 0) {
          const { data: bs, error: bsErr } = await supabase
            .from("booths")
            .select("booth_id,name,region,intro,category_l1,category_l2")
            .in("booth_id", boothIds);

          if (!bsErr && bs) {
            const map: Record<string, BoothRow> = {};
            (bs as BoothRow[]).forEach((b) => (map[b.booth_id] = b));
            setBoothMap(map);
          }
        }
      }

      setLoading(false);
    })();
  }, [supabase]);

  async function submitInquiry() {
    setInqOk(null);
    setMsg(null);

    if (!inqName.trim() || !inqPhone.trim()) {
      setMsg("이름과 연락처는 꼭 입력해 주세요.");
      return;
    }

    setInqBusy(true);

    // ✅ 1순위: inquiries 테이블에 저장(있으면)
    // ✅ 2순위: 없으면 에러가 나므로, 그때는 안내 문구로 fallback
    const payload = {
      name: inqName.trim(),
      phone: inqPhone.trim(),
      message: inqText.trim(),
      created_at: new Date().toISOString(),
      source: "market_live",
    };

    const { error } = await supabase.from("inquiries").insert(payload as any);

    if (error) {
      // 테이블이 없거나 RLS 막혔을 가능성
      setMsg(
        "상담 요청 저장에 실패했습니다. (inquiries 테이블/RLS 설정 필요) — 일단 오픈채팅/전화 링크 방식으로 바꾸는 게 안전합니다."
      );
    } else {
      setInqOk("✅ 상담 요청이 접수되었습니다. 곧 연락드리겠습니다.");
      setInqName("");
      setInqPhone("");
      setInqText("");
    }

    setInqBusy(false);
  }

  const embedUrl =
    live?.url && live.url.includes("youtube")
      ? toYouTubeEmbedUrl(live.url)
      : live?.url
      ? toYouTubeEmbedUrl(live.url)
      : null;

  return (
    <main style={ui.page}>
      <div style={ui.header}>
        <div>
          <h1 style={ui.h1}>🔴 LIVE 특판</h1>
          <p style={ui.sub}>
            한국농수산TV 라이브에서 진행되는 특판을 이곳에서 한눈에 확인하고, 바로 상담/구매로 연결합니다.
          </p>
        </div>
        <div style={ui.row}>
          <Btn href="/" style={{}}>{`홈`}</Btn>
        </div>
      </div>

      {msg && (
        <div style={{ ...ui.card, background: "#fff7ed", border: "1px solid #fed7aa" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <Card title="불러오는 중...">
          <p style={ui.muted}>LIVE 정보와 특판 상품을 가져오는 중입니다.</p>
        </Card>
      ) : (
        <>
          {/* LIVE 영역 */}
          <Card
            title="현재 LIVE"
            right={
              live?.url ? (
                <div style={ui.row}>
                  <Btn href={live.url} target="_blank" rel="noreferrer">
                    라이브 열기 ↗
                  </Btn>
                  {liveBooth?.booth_id && (
                    <Btn href={`/booth/${liveBooth.booth_id}`} target="_blank" rel="noreferrer">
                      부스 보기 ↗
                    </Btn>
                  )}
                </div>
              ) : (
                <span style={ui.pill}>라이브 링크 없음</span>
              )
            }
          >
            {live?.url && embedUrl && embedUrl.includes("youtube.com/embed") ? (
              <div style={{ maxWidth: 980 }}>
                <iframe
                  width="100%"
                  height="520"
                  src={embedUrl}
                  title={live?.title || "K-Agri Live"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: "1px solid #eee", borderRadius: 14 }}
                />
              </div>
            ) : live?.url ? (
              <div style={{ lineHeight: 1.6 }}>
                <div style={{ fontWeight: 900 }}>{live.title || "라이브 링크"}</div>
                <div style={{ marginTop: 8 }}>
                  <Btn href={live.url} target="_blank" rel="noreferrer" primary>
                    라이브로 이동 →
                  </Btn>
                </div>
              </div>
            ) : (
              <p style={ui.muted}>
                아직 등록된 LIVE 링크가 없습니다. <b>content_links</b>에 type=live로 최신 링크를 넣어주세요.
              </p>
            )}

            {liveBooth && (
              <div style={{ marginTop: 14, color: "#333", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 900 }}>
                  LIVE 진행 부스: {liveBooth.name || "이름 없음"}{" "}
                  <span style={{ ...ui.pill, marginLeft: 8 }}>
                    {liveBooth.category_l1 || "category"}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "#666" }}>
                  {liveBooth.region || "지역 미입력"} · {liveBooth.intro || "소개 미입력"}
                </div>
              </div>
            )}
          </Card>

          {/* 특판 상품 */}
          <div style={{ height: 14 }} />

          <Card
            title="오늘의 LIVE 특판 상품"
            right={<span style={ui.pill}>{products.length}개</span>}
          >
            {products.length === 0 ? (
              <p style={ui.muted}>
                아직 LIVE 특판 상품이 없습니다. (products에 <b>is_live=true</b>인 상품을 등록해 주세요)
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {products.map((p) => {
                  const booth = boothMap[p.booth_id];
                  const price =
                    p.live_price?.trim()
                      ? p.live_price
                      : p.price_type === "inquiry"
                      ? "문의(견적)"
                      : fmtWon(p.price) || "가격 미입력";

                  return (
                    <article
                      key={p.product_id}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 14,
                        padding: 14,
                        background: "#fff",
                      }}
                    >
                      {p.image_url && (
                        <div
                          style={{
                            width: "100%",
                            height: 160,
                            overflow: "hidden",
                            borderRadius: 12,
                            border: "1px solid #f1f1f1",
                            marginBottom: 10,
                            background: "#fafafa",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url}
                            alt={p.name || "product"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <strong style={{ fontSize: 16 }}>
                          {p.name || "이름 없음"}
                        </strong>
                        <span style={ui.pill}>{price}</span>
                        {p.live_until && (
                          <span style={ui.pill}>마감: {new Date(p.live_until).toLocaleString("ko-KR")}</span>
                        )}
                      </div>

                      {booth && (
                        <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                          부스: <b style={{ color: "#333" }}>{booth.name || "이름 없음"}</b>{" "}
                          · {booth.region || "지역 미입력"}
                        </div>
                      )}

                      {p.description && (
                        <div style={{ marginTop: 10, color: "#333", lineHeight: 1.55 }}>
                          {p.description}
                        </div>
                      )}

                      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Btn href={`/booth/${p.booth_id}`} target="_blank" rel="noreferrer">
                          부스 보기 ↗
                        </Btn>
                        {p.buy_url ? (
                          <Btn href={p.buy_url} target="_blank" rel="noreferrer" primary>
                            구매/문의 링크 →
                          </Btn>
                        ) : (
                          <span style={{ ...ui.pill, background: "#fff", border: "1px dashed #ddd" }}>
                            구매 링크 없음(문의 유도)
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 대량구매/상담 */}
          <div style={{ height: 14 }} />

          <Card title="📦 대량구매/상담 요청">
            <p style={{ marginTop: 0, color: "#333", lineHeight: 1.7 }}>
              바이어/대농/대량 구매 문의는 여기로 접수받습니다. (초기에는 <b>폼 방식</b>이 가장 안정적입니다)
            </p>

            <div style={ui.grid2}>
              <div>
                <div style={ui.label}>이름</div>
                <input
                  style={ui.input}
                  value={inqName}
                  onChange={(e) => setInqName(e.target.value)}
                  placeholder="예) 김○○"
                />
              </div>
              <div>
                <div style={ui.label}>연락처</div>
                <input
                  style={ui.input}
                  value={inqPhone}
                  onChange={(e) => setInqPhone(e.target.value)}
                  placeholder="예) 010-1234-5678"
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={ui.label}>요청 내용</div>
              <textarea
                style={ui.textarea}
                value={inqText}
                onChange={(e) => setInqText(e.target.value)}
                placeholder="예) 트랙터 2대 대량 견적 / 마늘 영양제 200박스 단가 문의"
              />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn primary onClick={submitInquiry} disabled={inqBusy}>
                {inqBusy ? "접수 중..." : "상담 요청 접수"}
              </Btn>

              {/* 초기 운영 안정판: 링크 방식 병행 추천 */}
              <Btn
                href="https://open.kakao.com/"
                target="_blank"
                rel="noreferrer"
              >
                카카오 오픈채팅(임시) ↗
              </Btn>
            </div>

            {inqOk && (
              <div style={{ marginTop: 12, ...ui.card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                {inqOk}
              </div>
            )}

            <div style={{ marginTop: 10, color: "#777", fontSize: 13, lineHeight: 1.6 }}>
              ※ 상담요청을 DB에 저장하려면 <b>inquiries</b> 테이블과 RLS 정책이 필요합니다(아래 SQL 참고).
            </div>
          </Card>
        </>
      )}
    </main>
  );
}