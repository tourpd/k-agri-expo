import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const ROOT =
    process.env.KAGRI_ARCHIVE_PATH ||
    "/Volumes";

  const rows:any[] = [];

  function walk(dir:string) {
    let files:string[] = [];

    try {
      files = fs.readdirSync(dir);
    } catch {
      return;
    }

    for (const file of files) {
      const full = path.join(dir,file);

      try {
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          walk(full);
          continue;
        }

        if (
          full.endsWith(".mp4") ||
          full.endsWith(".mov") ||
          full.endsWith(".mxf") ||
          full.endsWith(".avi")
        ) {
          rows.push({
            file_name:file,
            file_path:full,
            size_mb:Math.round(stat.size/1024/1024),
            modified_at:stat.mtime
          });
        }
      } catch {}
    }
  }

  walk(ROOT);

  return NextResponse.json({
    count:rows.length,
    items:rows.slice(0,5000)
  });
}
