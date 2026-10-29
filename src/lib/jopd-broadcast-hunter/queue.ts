import fs from "fs";
import path from "path";
import crypto from "crypto";

export type HunterQueueStatus =
  | "DISCOVERED"
  | "SOURCE_VERIFIED"
  | "RESEARCH_QUEUED"
  | "OBSERVED"
  | "INTENT_ANALYZED"
  | "DNA_EXTRACTED"
  | "REVIEWED"
  | "APPROVED_MEMORY";

export type HunterDiscoveryInput = {
  sourceRegistryId?: string;
  title: string;
  url: string;
  platform?: string;
  domain?: string;
  publishedAt?: string | null;
  discoveredBy: string;
  discoveryReason?: string;
};

export type HunterQueueItem = {
  id: string;
  status: HunterQueueStatus;
  title: string;
  url: string;
  canonicalUrl: string;
  sourceRegistryId: string | null;
  platform: string | null;
  domain: string | null;
  publishedAt: string | null;
  discoveredAt: string;
  discoveredBy: string;
  discoveryReason: string | null;
  provenance: {
    originalUrl: string;
    firstSeenAt: string;
  };
};

type HunterQueueFile = {
  engine: string;
  version: string;
  purpose?: string;
  pipeline?: string[];
  targets?: string[];
  items: HunterQueueItem[];
};

const QUEUE_FILE = path.join(
  process.cwd(),
  "jopd-studio",
  "broadcast-dna",
  "hunter",
  "QUEUE.json"
);

function canonicalizeUrl(raw: string): string {
  const url = new URL(raw.trim());

  url.hash = "";

  const removable = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
  ];

  for (const key of removable) {
    url.searchParams.delete(key);
  }

  url.hostname = url.hostname.toLowerCase();

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

function readQueue(): HunterQueueFile {
  const raw = fs.readFileSync(QUEUE_FILE, "utf8");
  const parsed = JSON.parse(raw) as HunterQueueFile;

  if (!Array.isArray(parsed.items)) {
    throw new Error("BROADCAST HUNTER QUEUE items가 배열이 아닙니다.");
  }

  return parsed;
}

function atomicWriteQueue(data: HunterQueueFile) {
  const tmp = `${QUEUE_FILE}.tmp`;

  fs.writeFileSync(
    tmp,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  fs.renameSync(tmp, QUEUE_FILE);
}

function makeId(canonicalUrl: string): string {
  return `broadcast-${crypto
    .createHash("sha256")
    .update(canonicalUrl)
    .digest("hex")
    .slice(0, 16)}`;
}

export function enqueueBroadcastDiscovery(
  input: HunterDiscoveryInput
): {
  inserted: boolean;
  item: HunterQueueItem;
} {
  if (!input.title?.trim()) {
    throw new Error("title이 필요합니다.");
  }

  if (!input.url?.trim()) {
    throw new Error("url이 필요합니다.");
  }

  if (!input.discoveredBy?.trim()) {
    throw new Error("discoveredBy가 필요합니다.");
  }

  const canonicalUrl = canonicalizeUrl(input.url);
  const queue = readQueue();

  const existing = queue.items.find(
    (item) => item.canonicalUrl === canonicalUrl
  );

  if (existing) {
    return {
      inserted: false,
      item: existing,
    };
  }

  const now = new Date().toISOString();

  const item: HunterQueueItem = {
    id: makeId(canonicalUrl),
    status: "DISCOVERED",
    title: input.title.trim(),
    url: input.url.trim(),
    canonicalUrl,
    sourceRegistryId:
      input.sourceRegistryId?.trim() || null,
    platform: input.platform?.trim() || null,
    domain: input.domain?.trim() || null,
    publishedAt: input.publishedAt || null,
    discoveredAt: now,
    discoveredBy: input.discoveredBy.trim(),
    discoveryReason:
      input.discoveryReason?.trim() || null,
    provenance: {
      originalUrl: input.url.trim(),
      firstSeenAt: now,
    },
  };

  queue.items.push(item);
  atomicWriteQueue(queue);

  return {
    inserted: true,
    item,
  };
}
