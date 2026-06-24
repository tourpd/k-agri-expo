import fs from "fs";
import path from "path";

const inDir = "data/koaftv/transcripts_vtt";
const outDir = "data/koaftv/transcripts_txt";
fs.mkdirSync(outDir, { recursive: true });

function cleanVtt(raw) {
  const lines = raw.split(/\r?\n/);
  const kept = [];
  let prev = "";

  for (const line of lines) {
    const s = line.trim();

    if (!s) continue;
    if (s === "WEBVTT") continue;
    if (s.startsWith("Kind:")) continue;
    if (s.startsWith("Language:")) continue;
    if (/^\d+$/.test(s)) continue;
    if (s.includes("-->")) continue;
    if (/^NOTE/.test(s)) continue;

    const cleaned = s
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;
    if (cleaned === prev) continue;

    kept.push(cleaned);
    prev = cleaned;
  }

  return kept.join("\n");
}

const files = fs.readdirSync(inDir)
  .filter(f => f.endsWith(".ko-orig.vtt") || f.endsWith(".ko.vtt"));

const byId = new Map();

for (const f of files) {
  const id = f.split(".")[0];
  const isOrig = f.includes(".ko-orig.");
  const current = byId.get(id);
  if (!current || isOrig) byId.set(id, f);
}

let count = 0;

for (const [id, file] of byId.entries()) {
  const raw = fs.readFileSync(path.join(inDir, file), "utf8");
  const txt = cleanVtt(raw);
  fs.writeFileSync(path.join(outDir, `${id}.txt`), txt, "utf8");
  count++;
}

console.log(`converted ${count} files`);
