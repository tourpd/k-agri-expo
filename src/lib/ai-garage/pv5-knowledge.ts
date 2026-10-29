import fs from "fs";
import path from "path";

export function loadPV5Specs() {
  const file = path.join(process.cwd(), "data/mobility/kia/pv5/specs/pv5.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function loadPV5KnowledgeText() {
  const dirs = [
    "data/mobility/kia/pv5/specs",
    "data/mobility/kia/pv5/official",
    "data/mobility/kia/pv5/youtube",
    "data/mobility/kia/pv5/lifestyle",
    "data/mobility/kia/pv5/pdf"
  ];

  let out = "";

  for (const dir of dirs) {
    const full = path.join(process.cwd(), dir);
    if (!fs.existsSync(full)) continue;

    for (const file of fs.readdirSync(full)) {
      const p = path.join(full, file);
      if (!fs.statSync(p).isFile()) continue;
      if (!/\.(json|md|txt)$/i.test(file)) continue;
      out += `\n\n--- ${dir}/${file} ---\n`;
      out += fs.readFileSync(p, "utf8").slice(0, 20000);
    }
  }

  return out.slice(0, 120000);
}
