import fs from "fs";
import path from "path";

const DIRS = [
  "data/mobility/kia/pv5/official",
  "data/mobility/kia/pv5/youtube",
  "data/mobility/kia/pv5/lifestyle",
  "data/mobility/kia/pv5/scenarios",
  "data/mobility/kia/pv5/showroom",
  "data/mobility/real-products",
  "data/pv5/processed",
  "data/pv5/json"
];

export function loadGarageKnowledge() {
  const root = process.cwd();

  return DIRS.map((dir) => {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) return "";

    return fs.readdirSync(full)
      .filter((f) => [".md", ".txt", ".json"].some((ext) => f.endsWith(ext)))
      .map((file) => {
        const p = path.join(full, file);
        return `\n\n--- ${dir}/${file} ---\n${fs.readFileSync(p, "utf8")}`;
      })
      .join("\n");
  }).join("\n");
}
