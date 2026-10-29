import fs from "fs";
import path from "path";

export function loadPV5Specs() {
  const file = path.join(process.cwd(), "data/mobility/kia/pv5/specs/pv5.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
