"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

type MediaItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number | null;
  objectUrl: string;
};

type ClipType = "SOURCE" | "BREATH";

type TimelineClip = {
  id: string;
  type: ClipType;

  sourceId?: string;

  sourceStart: number;
  sourceEnd: number;

  timelineStart: number;
  timelineEnd: number;

  label: string;
};

type HistoryState = {
  timeline: TimelineClip[];
};

function uid() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 ** 3) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatTime(seconds: number | null) {
  if (
    seconds === null ||
    !Number.isFinite(seconds)
  ) {
    return "--:--";
  }

  const safe = Math.max(0, seconds);

  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor(
    (safe - Math.floor(safe)) * 10,
  );

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(
      m,
    ).padStart(2, "0")}:${String(s).padStart(
      2,
      "0",
    )}.${ms}`;
  }

  return `${String(m).padStart(2, "0")}:${String(
    s,
  ).padStart(2, "0")}.${ms}`;
}

function normalizeTimeline(
  clips: TimelineClip[],
) {
  let cursor = 0;

  return clips.map((clip) => {
    const length =
      clip.type === "BREATH"
        ? clip.timelineEnd - clip.timelineStart
        : clip.sourceEnd - clip.sourceStart;

    const next = {
      ...clip,
      timelineStart: cursor,
      timelineEnd: cursor + Math.max(0.1, length),
    };

    cursor = next.timelineEnd;

    return next;
  });
}

export default function EditorPage() {
  const [media, setMedia] =
    useState<MediaItem[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [timeline, setTimeline] =
    useState<TimelineClip[]>([]);

  const [selectedClipId, setSelectedClipId] =
    useState<string | null>(null);

  const [markIn, setMarkIn] =
    useState<number | null>(null);

  const [markOut, setMarkOut] =
    useState<number | null>(null);

  const [zoom, setZoom] = useState(8);

  const [status, setStatus] = useState(
    "원본을 넣으면 실제 파일부터 확인합니다.",
  );

  const [history, setHistory] =
    useState<HistoryState[]>([]);

  const [future, setFuture] =
    useState<HistoryState[]>([]);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const selectedMedia = useMemo(
    () =>
      media.find(
        (item) => item.id === selectedId,
      ) || null,
    [media, selectedId],
  );

  const selectedClip = useMemo(
    () =>
      timeline.find(
        (clip) => clip.id === selectedClipId,
      ) || null,
    [timeline, selectedClipId],
  );

  const totalDuration = useMemo(
    () =>
      timeline.reduce(
        (max, clip) =>
          Math.max(max, clip.timelineEnd),
        0,
      ),
    [timeline],
  );

  function commit(next: TimelineClip[]) {
    setHistory((current) => [
      ...current.slice(-49),
      { timeline },
    ]);

    setFuture([]);

    setTimeline(
      normalizeTimeline(next),
    );
  }

  function undo() {
    if (!history.length) return;

    const previous =
      history[history.length - 1];

    setFuture((current) => [
      { timeline },
      ...current,
    ]);

    setTimeline(previous.timeline);

    setHistory((current) =>
      current.slice(0, -1),
    );

    setSelectedClipId(null);

    setStatus("실행취소");
  }

  function redo() {
    if (!future.length) return;

    const next = future[0];

    setHistory((current) => [
      ...current,
      { timeline },
    ]);

    setTimeline(next.timeline);

    setFuture((current) =>
      current.slice(1),
    );

    setSelectedClipId(null);

    setStatus("다시 실행");
  }

  async function inspectFile(
    file: File,
  ): Promise<MediaItem> {
    const objectUrl =
      URL.createObjectURL(file);

    let duration: number | null = null;

    if (
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/")
    ) {
      duration =
        await new Promise<number | null>(
          (resolve) => {
            const el =
              document.createElement(
                file.type.startsWith("video/")
                  ? "video"
                  : "audio",
              );

            el.preload = "metadata";

            el.onloadedmetadata = () => {
              resolve(
                Number.isFinite(el.duration)
                  ? el.duration
                  : null,
              );
            };

            el.onerror = () => resolve(null);

            el.src = objectUrl;
          },
        );
    }

    return {
      id: uid(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
      duration,
      objectUrl,
    };
  }

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files || [],
    );

    if (!files.length) return;

    setStatus(
      `${files.length}개 원본의 실제 메타데이터를 확인 중...`,
    );

    const inspected = await Promise.all(
      files.map(inspectFile),
    );

    setMedia((current) => [
      ...current,
      ...inspected,
    ]);

    if (!selectedId) {
      setSelectedId(inspected[0].id);
    }

    setStatus(
      `실제 원본 ${inspected.length}개 등록 완료`,
    );

    event.target.value = "";
  }

  function removeMedia(id: string) {
    const target = media.find(
      (item) => item.id === id,
    );

    if (target) {
      URL.revokeObjectURL(
        target.objectUrl,
      );
    }

    setMedia((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    );

    const nextTimeline =
      timeline.filter(
        (clip) =>
          clip.sourceId !== id,
      );

    commit(nextTimeline);

    if (selectedId === id) {
      const next = media.find(
        (item) => item.id !== id,
      );

      setSelectedId(next?.id || null);
    }
  }

  function currentSourceTime() {
    return videoRef.current?.currentTime || 0;
  }

  function setInPoint() {
    const t = currentSourceTime();

    setMarkIn(t);

    if (
      markOut !== null &&
      markOut <= t
    ) {
      setMarkOut(null);
    }

    setStatus(
      `IN ${formatTime(t)} 지정`,
    );
  }

  function setOutPoint() {
    const t = currentSourceTime();

    if (
      markIn !== null &&
      t <= markIn
    ) {
      setStatus(
        "OUT은 IN보다 뒤에 있어야 합니다.",
      );
      return;
    }

    setMarkOut(t);

    setStatus(
      `OUT ${formatTime(t)} 지정`,
    );
  }

  function addMarkedClip() {
    if (!selectedMedia) {
      setStatus("원본을 선택하세요.");
      return;
    }

    if (
      selectedMedia.duration === null
    ) {
      setStatus(
        "원본 길이를 확인할 수 없습니다.",
      );
      return;
    }

    const start =
      markIn ?? currentSourceTime();

    const end =
      markOut ??
      Math.min(
        start + 10,
        selectedMedia.duration,
      );

    if (end <= start) {
      setStatus(
        "유효한 IN/OUT 구간이 아닙니다.",
      );
      return;
    }

    const clip: TimelineClip = {
      id: uid(),
      type: "SOURCE",

      sourceId: selectedMedia.id,

      sourceStart: start,
      sourceEnd: end,

      timelineStart: 0,
      timelineEnd: end - start,

      label: selectedMedia.name,
    };

    commit([
      ...timeline,
      clip,
    ]);

    setSelectedClipId(clip.id);

    setMarkIn(null);
    setMarkOut(null);

    setStatus(
      `원본 ${formatTime(start)} → ${formatTime(
        end,
      )} 구간을 V1에 추가했습니다.`,
    );
  }

  function deleteClip(id: string) {
    commit(
      timeline.filter(
        (clip) => clip.id !== id,
      ),
    );

    setSelectedClipId(null);

    setStatus("클립 삭제");
  }

  function moveClip(
    id: string,
    direction: -1 | 1,
  ) {
    const index = timeline.findIndex(
      (clip) => clip.id === id,
    );

    if (index < 0) return;

    const target = index + direction;

    if (
      target < 0 ||
      target >= timeline.length
    ) {
      return;
    }

    const next = [...timeline];

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];

    commit(next);

    setStatus(
      direction < 0
        ? "클립을 앞으로 이동"
        : "클립을 뒤로 이동",
    );
  }

  function trimClip(
    id: string,
    side: "IN" | "OUT",
    delta: number,
  ) {
    const next = timeline.map(
      (clip) => {
        if (
          clip.id !== id ||
          clip.type !== "SOURCE"
        ) {
          return clip;
        }

        const source = media.find(
          (item) =>
            item.id === clip.sourceId,
        );

        if (side === "IN") {
          const value = Math.max(
            0,
            Math.min(
              clip.sourceStart + delta,
              clip.sourceEnd - 0.1,
            ),
          );

          return {
            ...clip,
            sourceStart: value,
          };
        }

        const max =
          source?.duration ??
          Number.MAX_SAFE_INTEGER;

        const value = Math.min(
          max,
          Math.max(
            clip.sourceStart + 0.1,
            clip.sourceEnd + delta,
          ),
        );

        return {
          ...clip,
          sourceEnd: value,
        };
      },
    );

    commit(next);

    setStatus(
      `${side} 컷점 ${
        delta > 0 ? "+" : ""
      }${delta.toFixed(1)}초 수정`,
    );
  }

  function splitClip(id: string) {
    const clip = timeline.find(
      (item) => item.id === id,
    );

    if (
      !clip ||
      clip.type !== "SOURCE"
    ) {
      return;
    }

    const player =
      videoRef.current;

    let splitAt =
      player?.currentTime ?? 0;

    if (
      selectedMedia?.id !==
      clip.sourceId
    ) {
      splitAt =
        clip.sourceStart +
        (clip.sourceEnd -
          clip.sourceStart) /
          2;
    }

    if (
      splitAt <=
        clip.sourceStart + 0.1 ||
      splitAt >=
        clip.sourceEnd - 0.1
    ) {
      setStatus(
        "클립 내부 위치에서 분할해야 합니다.",
      );
      return;
    }

    const first: TimelineClip = {
      ...clip,
      id: uid(),
      sourceEnd: splitAt,
    };

    const second: TimelineClip = {
      ...clip,
      id: uid(),
      sourceStart: splitAt,
    };

    const index = timeline.findIndex(
      (item) => item.id === id,
    );

    const next = [...timeline];

    next.splice(
      index,
      1,
      first,
      second,
    );

    commit(next);

    setSelectedClipId(second.id);

    setStatus(
      `${formatTime(
        splitAt,
      )}에서 클립 분할`,
    );
  }

  function insertBreath(
    seconds: number,
  ) {
    const breath: TimelineClip = {
      id: uid(),
      type: "BREATH",

      sourceStart: 0,
      sourceEnd: 0,

      timelineStart: 0,
      timelineEnd: seconds,

      label: `BREATH ${seconds.toFixed(
        1,
      )}초`,
    };

    if (!selectedClipId) {
      commit([
        ...timeline,
        breath,
      ]);

      setSelectedClipId(
        breath.id,
      );

      return;
    }

    const index =
      timeline.findIndex(
        (clip) =>
          clip.id === selectedClipId,
      );

    const next = [...timeline];

    next.splice(
      index + 1,
      0,
      breath,
    );

    commit(next);

    setSelectedClipId(
      breath.id,
    );

    setStatus(
      `선택 컷 뒤에 ${seconds.toFixed(
        1,
      )}초 호흡 삽입`,
    );
  }

  function changeBreath(
    id: string,
    delta: number,
  ) {
    const next = timeline.map(
      (clip) => {
        if (
          clip.id !== id ||
          clip.type !== "BREATH"
        ) {
          return clip;
        }

        const length =
          clip.timelineEnd -
          clip.timelineStart;

        const nextLength =
          Math.max(
            0.5,
            Math.min(
              10,
              length + delta,
            ),
          );

        return {
          ...clip,
          timelineEnd:
            clip.timelineStart +
            nextLength,
          label: `BREATH ${nextLength.toFixed(
            1,
          )}초`,
        };
      },
    );

    commit(next);
  }

  function seekToClip(
    clip: TimelineClip,
  ) {
    setSelectedClipId(clip.id);

    if (
      clip.type !== "SOURCE" ||
      !clip.sourceId
    ) {
      return;
    }

    setSelectedId(clip.sourceId);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime =
          clip.sourceStart;

        videoRef.current.play().catch(
          () => {},
        );
      }
    }, 100);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f2f2ef",
        color: "#171717",
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif',
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom:
            "1px solid #d8d8d8",
        }}
      >
        <div
          style={{
            maxWidth: 1700,
            margin: "0 auto",
            padding: "20px 28px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                color: "#777",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              JOPD AI EDITOR · 0.2
            </div>

            <h1
              style={{
                margin: "4px 0 0",
                fontSize: 28,
              }}
            >
              조PD 편집실
            </h1>
          </div>

          <a
            href="/studio"
            style={{
              color: "#111",
              fontWeight: 900,
            }}
          >
            ← 기획실
          </a>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1700,
          margin: "0 auto",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#111",
            color: "#fff",
            padding: 16,
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          <strong>
            SOURCE TRUTH MODE
          </strong>
          {" · "}
          원본의 실제 장면·실제 발언·실제
          타임코드만 편집합니다. 원본에 없는
          내용은 자동으로 만들지 않습니다.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "320px minmax(0,1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "#fff",
              border:
                "1px solid #ddd",
              padding: 16,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: 19,
              }}
            >
              원본 미디어
            </h2>

            <label
              style={{
                display: "block",
                border:
                  "2px dashed #aaa",
                padding: 22,
                textAlign: "center",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              + 원본 영상 추가

              <input
                type="file"
                multiple
                accept="video/*,audio/*"
                onChange={handleFiles}
                style={{
                  display: "none",
                }}
              />
            </label>

            {media.length === 0 && (
              <div
                style={{
                  color: "#777",
                  padding: "18px 0",
                }}
              >
                등록된 원본 없음
              </div>
            )}

            {media.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "13px 0",
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      item.id,
                    )
                  }
                  style={{
                    border: 0,
                    background:
                      "transparent",
                    width: "100%",
                    textAlign: "left",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <strong>
                    {item.name}
                  </strong>

                  <div
                    style={{
                      color: "#777",
                      marginTop: 5,
                      fontSize: 13,
                    }}
                  >
                    {formatBytes(
                      item.size,
                    )}
                    {" · "}
                    {formatTime(
                      item.duration,
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeMedia(
                      item.id,
                    )
                  }
                  style={{
                    marginTop: 8,
                    border:
                      "1px solid #bbb",
                    background: "#fff",
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}

            <div
              style={{
                marginTop: 20,
                padding: 14,
                background: "#f2f2f2",
                lineHeight: 1.7,
                fontSize: 13,
              }}
            >
              <strong>
                자동편집 순서
              </strong>
              <br />
              1. 오디오 전체 전사
              <br />
              2. 내용·숫자·인물 확인
              <br />
              3. 이야기 구성
              <br />
              4. 감정선 분석
              <br />
              5. 컷점·호흡 결정
              <br />
              6. 실제 SOURCE 배치
            </div>
          </section>

          <section
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: "#111",
                minHeight: 420,
                display: "flex",
                justifyContent:
                  "center",
                alignItems: "center",
                padding: 16,
              }}
            >
              {selectedMedia &&
              selectedMedia.type.startsWith(
                "video/",
              ) ? (
                <video
                  key={
                    selectedMedia.id
                  }
                  ref={videoRef}
                  src={
                    selectedMedia.objectUrl
                  }
                  controls
                  style={{
                    width: "100%",
                    maxHeight: 600,
                  }}
                />
              ) : (
                <div
                  style={{
                    color: "#aaa",
                  }}
                >
                  원본 영상을 선택하세요.
                </div>
              )}
            </div>

            {selectedMedia && (
              <div
                style={{
                  background: "#fff",
                  border:
                    "1px solid #ddd",
                  padding: 15,
                }}
              >
                <strong>
                  {selectedMedia.name}
                </strong>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={setInPoint}
                    style={controlButton}
                  >
                    IN 지정
                  </button>

                  <button
                    type="button"
                    onClick={setOutPoint}
                    style={controlButton}
                  >
                    OUT 지정
                  </button>

                  <button
                    type="button"
                    onClick={
                      addMarkedClip
                    }
                    style={{
                      ...controlButton,
                      background: "#111",
                      color: "#fff",
                    }}
                  >
                    V1에 넣기
                  </button>

                  <span
                    style={{
                      padding:
                        "9px 10px",
                      background:
                        "#eee",
                      fontWeight: 800,
                    }}
                  >
                    IN{" "}
                    {formatTime(markIn)}
                    {" / "}
                    OUT{" "}
                    {formatTime(markOut)}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        <section
          style={{
            marginTop: 18,
            background: "#fff",
            border:
              "1px solid #ddd",
          }}
        >
          <div
            style={{
              padding: 14,
              borderBottom:
                "1px solid #ddd",
              display: "flex",
              justifyContent:
                "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>
                편집 타임라인
              </strong>

              <span
                style={{
                  color: "#777",
                  marginLeft: 10,
                }}
              >
                {formatTime(
                  totalDuration,
                )}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={undo}
                disabled={!history.length}
                style={smallButton}
              >
                ↶ Undo
              </button>

              <button
                type="button"
                onClick={redo}
                disabled={!future.length}
                style={smallButton}
              >
                ↷ Redo
              </button>

              <button
                type="button"
                onClick={() =>
                  insertBreath(2)
                }
                style={smallButton}
              >
                + 호흡 2초
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom((z) =>
                    Math.max(3, z - 2),
                  )
                }
                style={smallButton}
              >
                − 축소
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom((z) =>
                    Math.min(30, z + 2),
                  )
                }
                style={smallButton}
              >
                + 확대
              </button>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
              padding: 16,
            }}
          >
            <div
              style={{
                minWidth: Math.max(
                  1000,
                  totalDuration *
                    zoom +
                    100,
                ),
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "65px 1fr",
                  paddingBottom: 10,
                  borderBottom:
                    "1px solid #ddd",
                }}
              >
                <strong>TIME</strong>

                <div
                  style={{
                    color: "#666",
                    wordSpacing: 30,
                  }}
                >
                  00:00 00:30 01:00 01:30
                  02:00 02:30
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "65px 1fr",
                  minHeight: 130,
                  padding: "12px 0",
                }}
              >
                <strong>V1</strong>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "stretch",
                    gap: 2,
                  }}
                >
                  {!timeline.length && (
                    <div
                      style={{
                        padding: 30,
                        color: "#888",
                      }}
                    >
                      아직 실제 클립이
                      없습니다.
                    </div>
                  )}

                  {timeline.map(
                    (clip) => {
                      const duration =
                        clip.timelineEnd -
                        clip.timelineStart;

                      const active =
                        selectedClipId ===
                        clip.id;

                      return (
                        <button
                          type="button"
                          key={clip.id}
                          onClick={() =>
                            seekToClip(
                              clip,
                            )
                          }
                          style={{
                            width: Math.max(
                              clip.type ===
                                "BREATH"
                                ? 70
                                : 110,
                              duration *
                                zoom,
                            ),
                            flex:
                              "0 0 auto",
                            border: active
                              ? "3px solid #111"
                              : "1px solid #aaa",
                            background:
                              clip.type ===
                              "BREATH"
                                ? "#fff"
                                : "#e5e5e5",
                            padding: 9,
                            textAlign:
                              "left",
                            cursor:
                              "pointer",
                            overflow:
                              "hidden",
                          }}
                        >
                          <strong>
                            {clip.type ===
                            "BREATH"
                              ? "호흡"
                              : clip.label}
                          </strong>

                          <div
                            style={{
                              fontSize:
                                11,
                              marginTop:
                                6,
                            }}
                          >
                            {clip.type ===
                            "SOURCE"
                              ? `SRC ${formatTime(
                                  clip.sourceStart,
                                )} → ${formatTime(
                                  clip.sourceEnd,
                                )}`
                              : `${duration.toFixed(
                                  1,
                                )}초`}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {selectedClip && (
          <section
            style={{
              marginTop: 14,
              background: "#fff",
              border:
                "1px solid #ddd",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#777",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  SELECTED CLIP
                </div>

                <strong
                  style={{
                    fontSize: 18,
                  }}
                >
                  {selectedClip.label}
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  deleteClip(
                    selectedClip.id,
                  )
                }
                style={{
                  ...smallButton,
                  border:
                    "1px solid #a55",
                }}
              >
                클립 삭제
              </button>
            </div>

            {selectedClip.type ===
              "SOURCE" && (
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 7,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    trimClip(
                      selectedClip.id,
                      "IN",
                      -0.5,
                    )
                  }
                  style={smallButton}
                >
                  IN −0.5초
                </button>

                <button
                  type="button"
                  onClick={() =>
                    trimClip(
                      selectedClip.id,
                      "IN",
                      0.5,
                    )
                  }
                  style={smallButton}
                >
                  IN +0.5초
                </button>

                <button
                  type="button"
                  onClick={() =>
                    trimClip(
                      selectedClip.id,
                      "OUT",
                      -0.5,
                    )
                  }
                  style={smallButton}
                >
                  OUT −0.5초
                </button>

                <button
                  type="button"
                  onClick={() =>
                    trimClip(
                      selectedClip.id,
                      "OUT",
                      0.5,
                    )
                  }
                  style={smallButton}
                >
                  OUT +0.5초
                </button>

                <button
                  type="button"
                  onClick={() =>
                    splitClip(
                      selectedClip.id,
                    )
                  }
                  style={smallButton}
                >
                  ✂ 현재 위치 분할
                </button>
              </div>
            )}

            {selectedClip.type ===
              "BREATH" && (
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 7,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    changeBreath(
                      selectedClip.id,
                      -0.5,
                    )
                  }
                  style={smallButton}
                >
                  여운 −0.5초
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeBreath(
                      selectedClip.id,
                      0.5,
                    )
                  }
                  style={smallButton}
                >
                  여운 +0.5초
                </button>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 7,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  moveClip(
                    selectedClip.id,
                    -1,
                  )
                }
                style={smallButton}
              >
                ← 앞으로
              </button>

              <button
                type="button"
                onClick={() =>
                  moveClip(
                    selectedClip.id,
                    1,
                  )
                }
                style={smallButton}
              >
                뒤로 →
              </button>
            </div>
          </section>
        )}

        <div
          style={{
            marginTop: 14,
            background: "#eee",
            padding: 14,
            fontWeight: 800,
          }}
        >
          {status}
        </div>

        <section
          style={{
            marginTop: 18,
            background: "#fff",
            border:
              "1px solid #ddd",
            padding: 20,
          }}
        >
          <div
            style={{
              color: "#777",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            ORIGINAL CONTENT ENGINE
          </div>

          <h2>
            AI 원본 내용 분석 · 다음 연결 단계
          </h2>

          <p
            style={{
              lineHeight: 1.8,
            }}
          >
            원본의 오디오 전체를 먼저
            전사하고 실제 발언·숫자·인물과
            타임코드를 확정합니다. 그 뒤
            이야기 구조와 감정선을 분석하고,
            문장 종료만이 아니라 침묵·표정·
            여운까지 고려해 컷 포인트를
            결정합니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 8,
            }}
          >
            {[
              "① 전체 오디오 전사",
              "② 실제 사실·숫자 확인",
              "③ 주제별 이야기 분리",
              "④ 스토리 재구성",
              "⑤ 감정선 분석",
              "⑥ 컷 포인트 판단",
              "⑦ 호흡·여운 배치",
              "⑧ V1/A1/SUB 자동편집",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "#f1f1ef",
                  padding: 13,
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const controlButton:
  React.CSSProperties = {
    border: "1px solid #aaa",
    background: "#fff",
    color: "#111",
    padding: "9px 13px",
    fontWeight: 900,
    cursor: "pointer",
  };

const smallButton:
  React.CSSProperties = {
    border: "1px solid #bbb",
    background: "#fff",
    color: "#111",
    padding: "8px 11px",
    fontWeight: 800,
    cursor: "pointer",
  };
