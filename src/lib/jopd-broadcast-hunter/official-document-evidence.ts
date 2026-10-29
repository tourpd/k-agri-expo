import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const PDFINFO = "/opt/homebrew/bin/pdfinfo";
const PDFTOTEXT = "/opt/homebrew/bin/pdftotext";
const PDFTOPPM = "/opt/homebrew/bin/pdftoppm";

export type OfficialDocumentFactInput = {
  factId: string;
  supportingText: string;
};

export type EvidenceRegion = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type LocatedOfficialDocumentFact = {
  factId: string;
  supportingText: string;
  pageNumber: number;
  matchScore: number;
  matchedTerms: string[];
  evidenceRegion: EvidenceRegion;
};

export type OfficialDocumentEvidenceManifest = {
  version: "JOPD_OFFICIAL_DOCUMENT_EVIDENCE_V2";
  createdAt: string;

  truthClass: "OFFICIAL_PRIMARY_DOCUMENT";
  evidenceType: "OFFICIAL_DOCUMENT";

  source: {
    authority: string;
    title: string;
    publishedAt: string;
    originalPageUrl: string;
    attachmentUrl: string;
    originalFilePath: string;
    originalBytes: number;
    sha256: string;
    mediaType: "application/pdf";
  };

  document: {
    pages: number;
    pageImages: Array<{
      pageNumber: number;
      path: string;
    }>;
  };

  facts: LocatedOfficialDocumentFact[];

  broadcastEvidencePolicy: {
    officialAttachmentPreferred: true;
    originalPreserved: true;
    sourceIdentityRequired: true;
    factPageAutoLocated: true;
    factRegionAutoLocated: true;
    derivedHighlightOnly: true;
    textOnlyEvidenceRejected: true;
    guessingForbidden: true;
  };

  gate: {
    status: "PASS";
    checks: {
      originalFileExists: true;
      originalFileNonEmpty: true;
      originalIsPdf: true;
      sourceIdentityComplete: true;
      officialAttachmentRecorded: true;
      pagesRendered: true;
      factsAutoLocated: true;
      factRegionsAutoLocated: true;
      ambiguousEvidenceRejected: true;
    };
  };
};

type PdfWord = {
  text: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

type PdfLine = {
  text: string;
  words: PdfWord[];
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

function run(binary: string, args: string[]): string {
  return execFileSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[“”"'‘’`]/g, "")
    .trim()
    .toLowerCase();
}

function tokens(value: string): string[] {
  const raw = value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}%㎡²]+/gu, " ")
    .split(/\s+/)
    .map((item) => normalize(item))
    .filter((item) => item.length >= 2);

  return [...new Set(raw)];
}

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

function pdfPageCount(pdfPath: string): number {
  const output = run(PDFINFO, [pdfPath]);
  const match = output.match(/^Pages:\s+(\d+)/m);

  if (!match) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: PDF page count unavailable",
    );
  }

  const pages = Number(match[1]);

  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: invalid PDF page count",
    );
  }

  return pages;
}

function extractPageText(
  pdfPath: string,
  pageNumber: number,
): string {
  return run(PDFTOTEXT, [
    "-f",
    String(pageNumber),
    "-l",
    String(pageNumber),
    "-layout",
    pdfPath,
    "-",
  ]);
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractPageLines(
  pdfPath: string,
  pageNumber: number,
): PdfLine[] {
  const xml = run(PDFTOTEXT, [
    "-f",
    String(pageNumber),
    "-l",
    String(pageNumber),
    "-bbox-layout",
    pdfPath,
    "-",
  ]);

  const lines: PdfLine[] = [];

  const lineRegex =
    /<line\s+xMin="([^"]+)"\s+yMin="([^"]+)"\s+xMax="([^"]+)"\s+yMax="([^"]+)">([\s\S]*?)<\/line>/g;

  let lineMatch: RegExpExecArray | null;

  while ((lineMatch = lineRegex.exec(xml)) !== null) {
    const body = lineMatch[5];

    const wordRegex =
      /<word\s+xMin="([^"]+)"\s+yMin="([^"]+)"\s+xMax="([^"]+)"\s+yMax="([^"]+)">([\s\S]*?)<\/word>/g;

    const words: PdfWord[] = [];
    let wordMatch: RegExpExecArray | null;

    while ((wordMatch = wordRegex.exec(body)) !== null) {
      const text = decodeXml(wordMatch[5]);

      if (!text) continue;

      words.push({
        text,
        xMin: Number(wordMatch[1]),
        yMin: Number(wordMatch[2]),
        xMax: Number(wordMatch[3]),
        yMax: Number(wordMatch[4]),
      });
    }

    if (!words.length) continue;

    lines.push({
      text: words.map((word) => word.text).join(" "),
      words,
      xMin: Number(lineMatch[1]),
      yMin: Number(lineMatch[2]),
      xMax: Number(lineMatch[3]),
      yMax: Number(lineMatch[4]),
    });
  }

  return lines;
}

function scorePage(
  supportingText: string,
  pageText: string,
): {
  score: number;
  matchedTerms: string[];
} {
  const pageNormalized = normalize(pageText);
  const factNormalized = normalize(supportingText);

  if (
    factNormalized.length >= 8 &&
    pageNormalized.includes(factNormalized)
  ) {
    return {
      score: 1,
      matchedTerms: tokens(supportingText),
    };
  }

  const factTokens = tokens(supportingText);

  if (!factTokens.length) {
    return {
      score: 0,
      matchedTerms: [],
    };
  }

  const matchedTerms = factTokens.filter((token) =>
    pageNormalized.includes(token),
  );

  return {
    score: matchedTerms.length / factTokens.length,
    matchedTerms,
  };
}

function locateBestLineWindow(
  lines: PdfLine[],
  supportingText: string,
): {
  region: EvidenceRegion;
  score: number;
} {
  const targetTokens = tokens(supportingText);

  if (!targetTokens.length) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: supporting text has no searchable terms",
    );
  }

  let best:
    | {
        start: number;
        end: number;
        score: number;
        coverage: number;
      }
    | null = null;

  /*
   * Search consecutive source lines, not arbitrary words
   * scattered across a page.
   *
   * A window may span at most 6 physical PDF lines.
   * This is a document-layout rule, not a news-specific rule.
   */
  const maxWindowLines = 6;

  for (let start = 0; start < lines.length; start += 1) {
    for (
      let end = start;
      end < lines.length &&
      end < start + maxWindowLines;
      end += 1
    ) {
      const windowText = lines
        .slice(start, end + 1)
        .map((line) => line.text)
        .join(" ");

      const normalizedWindow = normalize(windowText);
      const normalizedTarget = normalize(supportingText);

      const matched = targetTokens.filter((token) =>
        normalizedWindow.includes(token),
      );

      const coverage =
        matched.length / targetTokens.length;

      const exactBonus =
        normalizedTarget.length >= 8 &&
        normalizedWindow.includes(normalizedTarget)
          ? 0.35
          : 0;

      /*
       * Prefer high token coverage, then shorter windows.
       * This prevents a whole page from winning merely
       * because common words occur far apart.
       */
      const lengthPenalty =
        Math.max(0, end - start) * 0.015;

      const score =
        coverage + exactBonus - lengthPenalty;

      if (
        !best ||
        score > best.score ||
        (
          score === best.score &&
          end - start < best.end - best.start
        )
      ) {
        best = {
          start,
          end,
          score,
          coverage,
        };
      }
    }
  }

  if (!best || best.coverage < 0.35) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: contiguous evidence passage unavailable",
    );
  }

  const selected = lines.slice(
    best.start,
    best.end + 1,
  );

  const xMin = Math.min(
    ...selected.map((line) => line.xMin),
  );
  const yMin = Math.min(
    ...selected.map((line) => line.yMin),
  );
  const xMax = Math.max(
    ...selected.map((line) => line.xMax),
  );
  const yMax = Math.max(
    ...selected.map((line) => line.yMax),
  );

  const paddingX = 12;
  const paddingY = 8;

  return {
    region: {
      xMin: Math.max(0, xMin - paddingX),
      yMin: Math.max(0, yMin - paddingY),
      xMax: xMax + paddingX,
      yMax: yMax + paddingY,
    },
    score: best.coverage,
  };
}


function locateFact(
  pdfPath: string,
  pages: number,
  fact: OfficialDocumentFactInput,
): LocatedOfficialDocumentFact {
  if (!fact.factId.trim() || !fact.supportingText.trim()) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: invalid FACT input",
    );
  }

  const candidates = [];

  for (
    let pageNumber = 1;
    pageNumber <= pages;
    pageNumber += 1
  ) {
    const pageText = extractPageText(
      pdfPath,
      pageNumber,
    );

    const result = scorePage(
      fact.supportingText,
      pageText,
    );

    candidates.push({
      pageNumber,
      score: result.score,
      matchedTerms: result.matchedTerms,
    });
  }

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.pageNumber - b.pageNumber,
  );

  const best = candidates[0];
  const second = candidates[1];

  if (!best || best.score < 0.45) {
    throw new Error(
      `OFFICIAL_DOCUMENT_GATE: FACT not grounded in document: ${fact.factId}`,
    );
  }

  if (
    second &&
    best.score < 1 &&
    Math.abs(best.score - second.score) < 0.05
  ) {
    throw new Error(
      `OFFICIAL_DOCUMENT_GATE: ambiguous FACT page: ${fact.factId}`,
    );
  }

  const lines = extractPageLines(
    pdfPath,
    best.pageNumber,
  );

  const locatedPassage = locateBestLineWindow(
    lines,
    fact.supportingText,
  );

  const evidenceRegion = locatedPassage.region;

  return {
    factId: fact.factId,
    supportingText: fact.supportingText,
    pageNumber: best.pageNumber,
    matchScore: Number(best.score.toFixed(4)),
    matchedTerms: best.matchedTerms,
    evidenceRegion,
  };
}

async function atomicJsonWrite(
  targetPath: string,
  value: unknown,
): Promise<void> {
  const tempPath = `${targetPath}.tmp-${process.pid}`;

  await writeFile(
    tempPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );

  await rename(tempPath, targetPath);
}

export async function acquireOfficialDocumentEvidence(input: {
  authority: string;
  title: string;
  publishedAt: string;
  originalPageUrl: string;
  attachmentUrl: string;
  originalFilePath: string;
  outputDir: string;
  facts: OfficialDocumentFactInput[];
}): Promise<OfficialDocumentEvidenceManifest> {
  const originalFilePath = path.resolve(
    input.originalFilePath,
  );
  const outputDir = path.resolve(input.outputDir);

  const sourceInfo = await stat(originalFilePath);

  if (!sourceInfo.isFile() || sourceInfo.size <= 0) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: original document missing or empty",
    );
  }

  const header = await readFile(originalFilePath);

  if (
    header.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: source is not an original PDF",
    );
  }

  for (const [name, value] of Object.entries({
    authority: input.authority,
    title: input.title,
    publishedAt: input.publishedAt,
    originalPageUrl: input.originalPageUrl,
    attachmentUrl: input.attachmentUrl,
  })) {
    if (!value.trim()) {
      throw new Error(
        `OFFICIAL_DOCUMENT_GATE: missing source identity ${name}`,
      );
    }
  }

  if (!/^https?:\/\//.test(input.originalPageUrl)) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: invalid original page URL",
    );
  }

  if (!/^https?:\/\//.test(input.attachmentUrl)) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: invalid official attachment URL",
    );
  }

  const pages = pdfPageCount(originalFilePath);

  const firstPageText = extractPageText(
    originalFilePath,
    1,
  );

  if (!firstPageText.trim()) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: PDF has no readable first-page text",
    );
  }

  if (!input.facts.length) {
    throw new Error(
      "OFFICIAL_DOCUMENT_GATE: no FACT evidence supplied",
    );
  }

  /*
   * IMPORTANT:
   * page numbers and coordinates are deliberately NOT
   * accepted from callers. Every FACT must be located
   * from the original document itself.
   */
  const locatedFacts = input.facts.map((fact) =>
    locateFact(originalFilePath, pages, fact),
  );

  const pagesDir = path.join(
    outputDir,
    "original-pages",
  );

  await mkdir(pagesDir, { recursive: true });

  run(PDFTOPPM, [
    "-png",
    "-r",
    "150",
    originalFilePath,
    path.join(pagesDir, "page"),
  ]);

  const pageImages: Array<{
    pageNumber: number;
    path: string;
  }> = [];

  for (
    let pageNumber = 1;
    pageNumber <= pages;
    pageNumber += 1
  ) {
    const pagePath = path.join(
      pagesDir,
      `page-${pageNumber}.png`,
    );

    const pageInfo = await stat(pagePath);

    if (!pageInfo.isFile() || pageInfo.size <= 0) {
      throw new Error(
        `OFFICIAL_DOCUMENT_GATE: rendered page ${pageNumber} missing`,
      );
    }

    pageImages.push({
      pageNumber,
      path: pagePath,
    });
  }

  const manifest: OfficialDocumentEvidenceManifest = {
    version: "JOPD_OFFICIAL_DOCUMENT_EVIDENCE_V2",
    createdAt: new Date().toISOString(),

    truthClass: "OFFICIAL_PRIMARY_DOCUMENT",
    evidenceType: "OFFICIAL_DOCUMENT",

    source: {
      authority: input.authority,
      title: input.title,
      publishedAt: input.publishedAt,
      originalPageUrl: input.originalPageUrl,
      attachmentUrl: input.attachmentUrl,
      originalFilePath,
      originalBytes: sourceInfo.size,
      sha256: await sha256File(originalFilePath),
      mediaType: "application/pdf",
    },

    document: {
      pages,
      pageImages,
    },

    facts: locatedFacts,

    broadcastEvidencePolicy: {
      officialAttachmentPreferred: true,
      originalPreserved: true,
      sourceIdentityRequired: true,
      factPageAutoLocated: true,
      factRegionAutoLocated: true,
      derivedHighlightOnly: true,
      textOnlyEvidenceRejected: true,
      guessingForbidden: true,
    },

    gate: {
      status: "PASS",
      checks: {
        originalFileExists: true,
        originalFileNonEmpty: true,
        originalIsPdf: true,
        sourceIdentityComplete: true,
        officialAttachmentRecorded: true,
        pagesRendered: true,
        factsAutoLocated: true,
        factRegionsAutoLocated: true,
        ambiguousEvidenceRejected: true,
      },
    },
  };

  await mkdir(outputDir, { recursive: true });

  await atomicJsonWrite(
    path.join(
      outputDir,
      "OFFICIAL_DOCUMENT_EVIDENCE.json",
    ),
    manifest,
  );

  return manifest;
}
