import fs from "fs";

export type VisualAssetRealityStatus =
  | "READY_EXISTING"
  | "READY_TO_GENERATE"
  | "NEEDS_HUNTER";

export type VisualAssetRealityBeat = {
  beatId: string;
  segmentId: string;
  status: VisualAssetRealityStatus;
  selectedKind: string | null;
  factIds: string[];
  evidenceRequired: boolean;
  assetPath: string | null;
  pageNumber: number | null;
  evidenceRegion: unknown | null;
  hunterKinds: string[];
  searchIntents: string[];
};

const GENERATABLE_KINDS = new Set([
  "DATA_GRAPHIC",
  "TITLE_CARD",
  "ACTION_CARD",
]);

const EXTERNAL_KINDS = new Set([
  "FIELD_VIDEO",
  "RELATED_FOOTAGE",
  "PHOTO",
  "INTERVIEW",
  "OFFICIAL_WEBPAGE",
]);

export function buildVisualAssetReality(input: {
  visualDirectorPath: string;
  officialDocumentEvidencePath: string;
}) {
  const director = JSON.parse(
    fs.readFileSync(input.visualDirectorPath, "utf8"),
  );

  const official = JSON.parse(
    fs.readFileSync(input.officialDocumentEvidencePath, "utf8"),
  );

  if (official?.gate?.status !== "PASS") {
    throw new Error(
      "VISUAL_ASSET_REALITY: official document evidence gate is not PASS",
    );
  }

  const pageByNumber = new Map<number, string>(
    (official.document?.pageImages || []).map((page: any) => [
      page.pageNumber,
      page.path,
    ]),
  );

  const officialFactById = new Map<string, any>(
    (official.facts || []).map((fact: any) => [
      fact.factId,
      fact,
    ]),
  );

  const beats: VisualAssetRealityBeat[] =
    (director.beats || []).map((beat: any) => {
      const kinds: string[] = beat.preferredKinds || [];
      const factIds: string[] = beat.factIds || [];

      if (kinds.includes("OFFICIAL_DOCUMENT")) {
        const matches = factIds
          .map((factId) => officialFactById.get(factId))
          .filter(Boolean);

        if (matches.length > 0) {
          const match = matches[0];
          const assetPath =
            pageByNumber.get(match.pageNumber) || null;

          if (assetPath && fs.existsSync(assetPath)) {
            return {
              beatId: beat.beatId,
              segmentId: beat.segmentId,
              status: "READY_EXISTING" as const,
              selectedKind: "OFFICIAL_DOCUMENT",
              factIds,
              evidenceRequired: Boolean(beat.evidenceRequired),
              assetPath,
              pageNumber: match.pageNumber,
              evidenceRegion: match.evidenceRegion || null,
              hunterKinds: [],
              searchIntents: beat.searchIntents || [],
            };
          }
        }
      }

      const generatableKind =
        kinds.find((kind) => GENERATABLE_KINDS.has(kind)) || null;

      if (generatableKind) {
        return {
          beatId: beat.beatId,
          segmentId: beat.segmentId,
          status: "READY_TO_GENERATE" as const,
          selectedKind: generatableKind,
          factIds,
          evidenceRequired: Boolean(beat.evidenceRequired),
          assetPath: null,
          pageNumber: null,
          evidenceRegion: null,
          hunterKinds: [],
          searchIntents: beat.searchIntents || [],
        };
      }

      return {
        beatId: beat.beatId,
        segmentId: beat.segmentId,
        status: "NEEDS_HUNTER" as const,
        selectedKind: null,
        factIds,
        evidenceRequired: Boolean(beat.evidenceRequired),
        assetPath: null,
        pageNumber: null,
        evidenceRegion: null,
        hunterKinds: kinds.filter((kind) =>
          EXTERNAL_KINDS.has(kind),
        ),
        searchIntents: beat.searchIntents || [],
      };
    });

  return {
    version: "K_AGRI_ACTION_NEWS_VISUAL_ASSET_REALITY_V1",
    sourceVisualDirectorVersion: director.version,
    officialDocumentGate: official.gate.status,
    beats,
    summary: {
      total: beats.length,
      readyExisting: beats.filter(
        (beat) => beat.status === "READY_EXISTING",
      ).length,
      readyToGenerate: beats.filter(
        (beat) => beat.status === "READY_TO_GENERATE",
      ).length,
      needsHunter: beats.filter(
        (beat) => beat.status === "NEEDS_HUNTER",
      ).length,
    },
  };
}
