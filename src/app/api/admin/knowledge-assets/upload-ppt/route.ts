import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { mkdir, readFile, rm, writeFile, readdir } from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const soffice = "/opt/homebrew/bin/soffice";
const pdftotext = "/opt/homebrew/bin/pdftotext";
const pdftoppm = "/opt/homebrew/bin/pdftoppm";

function safeName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "_")
    .slice(0, 80) + "_" + Date.now();
}

function stripXml(xml: string) {
  return xml
    .replace(/<a:br\/>/g, "\n")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function convertWithSoffice(inputPath: string, outDir: string, format: string) {
  await execFileAsync(soffice, ["--headless", "--convert-to", format, "--outdir", outDir, inputPath]);
  const base = path.basename(inputPath, path.extname(inputPath));
  const ext = format.split(":")[0];
  return path.join(outDir, `${base}.${ext}`);
}

async function renderPdfToImages(pdfPath: string, publicDirName: string) {
  const outDir = path.join(process.cwd(), "public", "uploads", "knowledge-pages", publicDirName);
  await mkdir(outDir, { recursive: true });

  await execFileAsync(pdftoppm, ["-png", pdfPath, path.join(outDir, "page")]);

  const files = (await readdir(outDir))
    .filter((x) => x.endsWith(".png"))
    .sort();

  return files.map((f) => `/uploads/knowledge-pages/${publicDirName}/${f}`);
}

async function extractPptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
      return na - nb;
    });

  const chunks: string[] = [];
  for (const slide of slideFiles) {
    const xml = await zip.files[slide].async("text");
    const text = stripXml(xml);
    if (text) {
      const n = slide.match(/slide(\d+)\.xml/)?.[1] || "";
      chunks.push(`[슬라이드 ${n}]\n${text}`);
    }
  }

  return { pageCount: slideFiles.length, text: chunks.join("\n\n") };
}

async function extractDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.files["word/document.xml"];
  if (!file) return { pageCount: 1, text: "" };
  const xml = await file.async("text");
  return { pageCount: 1, text: stripXml(xml) };
}

async function extractHwpx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xmlFiles = Object.keys(zip.files).filter((name) => name.endsWith(".xml")).sort();
  const chunks: string[] = [];

  for (const f of xmlFiles) {
    if (!f.includes("Contents") && !f.includes("section")) continue;
    const xml = await zip.files[f].async("text");
    const text = stripXml(xml);
    if (text) chunks.push(text);
  }

  return { pageCount: chunks.length, text: chunks.join("\n\n") };
}

export async function POST(req: NextRequest) {
  let tempDir = "";

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    const originalName = file.name;
    const name = originalName.toLowerCase();
    const allowed = [".ppt", ".pptx", ".pdf", ".doc", ".docx", ".hwp", ".hwpx"];

    if (!allowed.some((ext) => name.endsWith(ext))) {
      return NextResponse.json({ error: "지원 파일: ppt, pptx, pdf, doc, docx, hwp, hwpx" }, { status: 400 });
    }

    tempDir = path.join(os.tmpdir(), `kagri-doc-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    let buffer = Buffer.from(await file.arrayBuffer());
    const inputPath = path.join(tempDir, originalName);
    await writeFile(inputPath, buffer);

    const assetDir = safeName(originalName);

    if (name.endsWith(".pdf")) {
      const txtPath = path.join(tempDir, "out.txt");
      await execFileAsync(pdftotext, ["-layout", inputPath, txtPath]);
      const text = await readFile(txtPath, "utf8");
      const imageUrls = await renderPdfToImages(inputPath, assetDir);
      return NextResponse.json({ ok: true, fileName: originalName, fileType: "pdf", slideCount: imageUrls.length, text, imageUrls });
    }

    if (name.endsWith(".ppt") || name.endsWith(".pptx")) {
      let extracted = { pageCount: 0, text: "" };

      if (name.endsWith(".pptx")) {
        extracted = await extractPptx(buffer);
      }

      const pdfPath = await convertWithSoffice(inputPath, tempDir, "pdf");

      const txtPath = path.join(tempDir, "ppt-out.txt");
      let pdfText = "";
      try {
        await execFileAsync(pdftotext, ["-layout", pdfPath, txtPath]);
        pdfText = await readFile(txtPath, "utf8");
      } catch {}

      const imageUrls = await renderPdfToImages(pdfPath, assetDir);

      const text = extracted.text || pdfText;

      return NextResponse.json({
        ok: true,
        fileName: originalName,
        fileType: name.endsWith(".ppt") ? "ppt" : "pptx",
        slideCount: imageUrls.length || extracted.pageCount,
        text,
        imageUrls,
      });
    }

    if (name.endsWith(".docx")) {
      const extracted = await extractDocx(buffer);

      let imageUrls: string[] = [];
      try {
        const pdfPath = await convertWithSoffice(inputPath, tempDir, "pdf");
        imageUrls = await renderPdfToImages(pdfPath, assetDir);
      } catch {
        imageUrls = await [];
      }

      

      return NextResponse.json({
        ok: true,
        fileName: originalName,
        fileType: "docx",
        slideCount: imageUrls.length || extracted.pageCount,
        text: extracted.text,
        imageUrls,
        
      });
    }

    if (name.endsWith(".hwpx")) {
      const extracted = await extractHwpx(buffer);

      let imageUrls: string[] = [];
      try {
        const pdfPath = await convertWithSoffice(inputPath, tempDir, "pdf");
        imageUrls = await renderPdfToImages(pdfPath, assetDir);
      } catch {
        imageUrls = await [];
      }

      

      return NextResponse.json({
        ok: true,
        fileName: originalName,
        fileType: "hwpx",
        slideCount: imageUrls.length || extracted.pageCount,
        text: extracted.text,
        imageUrls,
        
      });
    }

    if (name.endsWith(".doc") || name.endsWith(".hwp")) {
      const fileType = name.endsWith(".hwp") ? "hwp" : "doc";

      let text = "";
      try {
        const txtPath = await convertWithSoffice(inputPath, tempDir, "txt:Text");
        text = await readFile(txtPath, "utf8");
      } catch {
        text = "";
      }

      let imageUrls: string[] = [];
      try {
        const pdfPath = await convertWithSoffice(inputPath, tempDir, "pdf");
        imageUrls = await renderPdfToImages(pdfPath, assetDir);
      } catch {
        imageUrls = await [];
      }

      

      return NextResponse.json({
        ok: true,
        fileName: originalName,
        fileType,
        slideCount: imageUrls.length,
        text,
        imageUrls,
        
      });
    }

    return NextResponse.json({ error: "처리할 수 없는 파일입니다." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "파일 텍스트 추출 실패" }, { status: 500 });
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
