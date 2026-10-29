import fs from "fs";

type TimelineUnit = {
  unitIndex: number;
  startSeconds: number;
  endSeconds: number;
  audio?: {
    combinedText?: string;
  };
  visual?: {
    observations?: unknown[];
  };
  alignment?: {
    hasAudio?: boolean;
    hasVisual?: boolean;
    audioSegmentCount?: number;
    visualObservationCount?: number;
  };
};

type MultimodalEvidence = {
  version?: string;
  multimodalEvidenceId?: string;
  evidenceType?: string;
  sourceTimebase?: string;
  source?: {
    durationSeconds?: number;
  };
  timeline?: TimelineUnit[];
};

export function multimodalFileToResearchContent(
  file: string
): {
  content: string;
  startMs: number;
  endMs: number;
  provenanceNote: string;
  unitCount: number;
} {
  const data = JSON.parse(
    fs.readFileSync(file, "utf8")
  ) as MultimodalEvidence;

  const timeline = Array.isArray(data.timeline)
    ? data.timeline
    : [];

  if (timeline.length === 0) {
    throw new Error(
      "Multimodal Evidence timeline이 비어 있습니다."
    );
  }

  const blocks = timeline.map((unit) => {
    const audio =
      unit.audio?.combinedText?.trim() ||
      "[NO_OBSERVED_SPEECH]";

    const visual =
      Array.isArray(unit.visual?.observations)
        ? unit.visual.observations
        : [];

    return [
      `===== TIMELINE UNIT ${unit.unitIndex} =====`,
      `TIME: ${unit.startSeconds}s - ${unit.endSeconds}s`,
      `AUDIO_TRANSCRIPT: ${audio}`,
      `VISUAL_OBSERVATION: ${JSON.stringify(visual)}`,
      `ALIGNMENT: ${JSON.stringify(unit.alignment || {})}`,
    ].join("\n");
  });

  const startSeconds = Math.min(
    ...timeline.map((u) => u.startSeconds)
  );

  const endSeconds = Math.max(
    ...timeline.map((u) => u.endSeconds)
  );

  return {
    content: blocks.join("\n\n"),
    startMs: Math.round(startSeconds * 1000),
    endMs: Math.round(endSeconds * 1000),
    provenanceNote: [
      `MULTIMODAL_EVIDENCE_ID=${data.multimodalEvidenceId || "UNKNOWN"}`,
      `VERSION=${data.version || "UNKNOWN"}`,
      `TIMEBASE=${data.sourceTimebase || "UNKNOWN"}`,
      `TIMELINE_UNITS=${timeline.length}`,
      "AUDIO=TRANSCRIPTION_EVIDENCE",
      "VISUAL=FRAME_OBSERVATION_EVIDENCE",
      "NOT_COMMENTS",
      "NOT_AUDIO_MUSIC_OBSERVATION",
      "NOT_CREATOR_INTERVIEW"
    ].join("; "),
    unitCount: timeline.length,
  };
}
