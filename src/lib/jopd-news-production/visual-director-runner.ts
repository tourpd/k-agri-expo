import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";

import { directNewsVisuals } from "./visual-director";
import type { NewsArticleSegmentInput } from "./visual-plan";

type ArticleSegment = {
  segment_id: string;
  role: string;
  text: string;
  fact_ids?: string[];
};

type ArticleFile = {
  news_id: string;
  segments: ArticleSegment[];
};

type TimelineCut = {
  segment_id: string;
  start_seconds: number;
  end_seconds: number;
};

type TimelineFile = {
  news_id: string;
  cuts: TimelineCut[];
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function atomicWriteJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp-${process.pid}`;

  fs.writeFileSync(
    tempPath,
    JSON.stringify(value, null, 2) + "\n",
    "utf8",
  );

  fs.renameSync(tempPath, filePath);
}

export async function runNewsVisualDirector(params: {
  newsRoot: string;
  outputPath?: string;
}) {
  loadEnvConfig(process.cwd());

  const articlePath = path.join(
    params.newsRoot,
    "article",
    "ARTICLE.json",
  );

  const timelinePath = path.join(
    params.newsRoot,
    "production",
    "FIRST_CUT_TIMELINE.json",
  );

  if (!fs.existsSync(articlePath)) {
    throw new Error(`ARTICLE NOT FOUND: ${articlePath}`);
  }

  if (!fs.existsSync(timelinePath)) {
    throw new Error(`TIMELINE NOT FOUND: ${timelinePath}`);
  }

  const article = readJson<ArticleFile>(articlePath);
  const timeline = readJson<TimelineFile>(timelinePath);

  if (article.news_id !== timeline.news_id) {
    throw new Error(
      `NEWS ID MISMATCH: article=${article.news_id} timeline=${timeline.news_id}`,
    );
  }

  const cutById = new Map(
    timeline.cuts.map((cut) => [cut.segment_id, cut]),
  );

  const segments: NewsArticleSegmentInput[] =
    article.segments.map((segment) => {
      const cut = cutById.get(segment.segment_id);

      if (!cut) {
        throw new Error(
          `TIMELINE CUT MISSING: ${segment.segment_id}`,
        );
      }

      return {
        segmentId: segment.segment_id,
        role: segment.role,
        narration: segment.text,
        startSeconds: cut.start_seconds,
        endSeconds: cut.end_seconds,
        factIds: segment.fact_ids || [],
      };
    });

  if (segments.length !== timeline.cuts.length) {
    throw new Error(
      `SEGMENT/CUT COUNT MISMATCH: ${segments.length}/${timeline.cuts.length}`,
    );
  }

  const result = await directNewsVisuals({
    segments,
  });

  const output = {
    newsId: article.news_id,
    generatedAt: new Date().toISOString(),
    articlePath,
    timelinePath,
    ...result,
  };

  const outputPath =
    params.outputPath ||
    path.join(
      params.newsRoot,
      "production",
      "VISUAL_DIRECTOR.json",
    );

  atomicWriteJson(outputPath, output);

  return {
    outputPath,
    output,
  };
}
