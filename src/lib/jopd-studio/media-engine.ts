export type MediaSource = {
  id: string;
  name: string;
  type: string;
  size: number;
  duration: number | null;
  createdAt: string;
};

export type TranscriptSegment = {
  id: string;
  sourceId: string;

  sourceStart: number;
  sourceEnd: number;

  text: string;

  speaker?: string;

  verified: boolean;
};

export type VerifiedFact = {
  id: string;

  type:
    | "number"
    | "person"
    | "place"
    | "statement"
    | "object";

  value: string;

  sourceId: string;

  sourceStart?: number;
  sourceEnd?: number;

  evidence: string;

  verified: boolean;
};

export type TimelineClip = {
  id: string;

  track:
    | "V1"
    | "V2"
    | "A1"
    | "BGM"
    | "SUB";

  sourceId: string;

  sourceStart: number;
  sourceEnd: number;

  timelineStart: number;
  timelineEnd: number;

  label: string;

  transcript?: string;
};

export type MissingShot = {
  id: string;
  description: string;
  reason: string;
};

export type EditProject = {
  sources: MediaSource[];

  transcript: TranscriptSegment[];

  verifiedFacts: VerifiedFact[];

  timeline: TimelineClip[];

  missingShots: MissingShot[];
};


/**
 * JOPD SOURCE-TRUTH RULE
 *
 * 타임라인에는 실제 sourceId가 존재하는
 * 클립만 들어갈 수 있다.
 *
 * AI가 상상한 장면은 TimelineClip으로
 * 생성할 수 없다.
 */

export function validateTimelineClip(
  project: EditProject,
  clip: TimelineClip,
) {
  const source =
    project.sources.find(
      (item) =>
        item.id === clip.sourceId,
    );

  if (!source) {
    return {
      ok: false,
      error:
        "원본에 존재하지 않는 소스입니다.",
    };
  }

  if (
    clip.sourceStart < 0 ||
    clip.sourceEnd <=
      clip.sourceStart
  ) {
    return {
      ok: false,
      error:
        "잘못된 원본 타임코드입니다.",
    };
  }

  if (
    source.duration !== null &&
    clip.sourceEnd >
      source.duration
  ) {
    return {
      ok: false,
      error:
        "원본 영상 길이를 벗어난 구간입니다.",
    };
  }

  return {
    ok: true,
  };
}
