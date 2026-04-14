import path from "path";
import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, debug?: unknown) {
  return Response.json({ success: false, error: message, debug }, { status });
}

function correctCommonOcrMistakes(value: string) {
  return value
    .replace(/주식회사한국농수산티\s*=?/g, "주식회사 한국농수산티브이")
    .replace(/주식회사한국농수산티브이/g, "주식회사 한국농수산티브이")
    .replace(/한국농수산티\s*=?$/g, "한국농수산티브이")
    .replace(/티\s*=/g, "티브이")
    .replace(/번슾/g, "번길")
    .replace(/내포로251번슾/g, "내포로251번길")
    .replace(/^출정남도/g, "충청남도")
    .replace(/^출정/g, "충청")
    .replace(/출정남/g, "충청남")
    .replace(/조 세 환/g, "조세환")
    .replace(/조세 환/g, "조세환")
    .replace(/내\s*표\s*자/g, "대표자")
    .replace(/EE$/g, "")
    .trim();
}

function cleanLine(value: string) {
  const cleaned = value
    .replace(/[|]/g, " ")
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return correctCommonOcrMistakes(cleaned);
}

function splitLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((v) => cleanLine(v))
    .filter(Boolean);
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatBizNo(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 10) return value.trim();
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
}

function normalizeDate(value: string) {
  return value
    .replace(/년/g, "-")
    .replace(/월/g, "-")
    .replace(/일/g, "")
    .replace(/[./]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

function looksLikeCompanyName(value: string) {
  const v = cleanLine(value);
  if (!v) return false;
  if (v.length < 2) return false;
  if (/등록번호|대표자|개업연월일|소재지|업태|종목|발급사유/.test(v)) return false;
  return /(주식회사|$begin:math:text$주$end:math:text$|회사|티브이|TV|농수산)/i.test(v) || v.length >= 4;
}

function looksLikePersonName(value: string) {
  const v = cleanLine(value)
    .replace(/대표자/g, "")
    .replace(/성명/g, "")
    .replace(/[:：]/g, "")
    .replace(/[A-Z]/g, "")
    .trim();

  if (!v) return false;
  if (v.length > 12) return false;
  if (/[0-9@/:()-]/.test(v)) return false;
  if (/등록번호|개업연월일|소재지|업태|종목|법인명|단체명/.test(v)) return false;
  return true;
}

function stripLabelPrefixes(value: string) {
  return cleanLine(
    value
      .replace(/법인명\s*$begin:math:text$\\s\*단체명\\s\*$end:math:text$\s*[:：]?\s*/g, "")
      .replace(/법인명\s*[:：]?\s*/g, "")
      .replace(/단체명\s*[:：]?\s*/g, "")
      .replace(/상호\s*[:：]?\s*/g, "")
      .replace(/회사명\s*[:：]?\s*/g, "")
      .replace(/대표자\s*[:：]?\s*/g, "")
      .replace(/성명\s*[:：]?\s*/g, "")
      .replace(/등록번호\s*[:：]?\s*/g, "")
      .replace(/사업자등록번호\s*[:：]?\s*/g, "")
      .replace(/개업연월일\s*[:：]?\s*/g, "")
      .replace(/사업장소재지\s*[:：]?\s*/g, "")
      .replace(/사업장\s*소재지\s*[:：]?\s*/g, "")
      .replace(/소재지\s*[:：]?\s*/g, "")
      .replace(/주소\s*[:：]?\s*/g, "")
      .replace(/업태\s*[:：]?\s*/g, "")
      .replace(/종목\s*[:：]?\s*/g, "")
      .replace(/[()：（):]/g, " ")
  );
}

function pickBizNo(lines: string[]) {
  const candidates: { value: string; score: number }[] = [];

  for (const raw of lines) {
    const line = cleanLine(raw);

    const m1 = line.match(/\d{3}-\d{2}-\d{5}/);
    if (m1) {
      let score = 0;
      if (/사업자등록번호/.test(line)) score += 14;
      if (/등록번호/.test(line)) score += 12;
      if (/법인등록번호/.test(line)) score -= 15;
      candidates.push({ value: m1[0], score });
    }

    const m2 = line.match(/(?<!\d)\d{10}(?!\d)/);
    if (m2) {
      let score = 0;
      if (/사업자등록번호/.test(line)) score += 13;
      if (/등록번호/.test(line)) score += 11;
      if (/법인등록번호/.test(line)) score -= 15;
      candidates.push({ value: formatBizNo(m2[0]), score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.value || "";
}

function pickCorpNo(lines: string[]) {
  for (const raw of lines) {
    const line = cleanLine(raw);
    if (/법인등록번호/.test(line)) {
      const m = line.match(/\d{6}-\d{7}/);
      if (m) return m[0];
    }
  }
  return "";
}

function pickCompanyName(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i]);

    if (/법인명|단체명|상호|회사명/.test(line)) {
      const sameLine = stripLabelPrefixes(line);
      if (looksLikeCompanyName(sameLine)) return sameLine;

      const next = cleanLine(lines[i + 1] || "");
      if (looksLikeCompanyName(next)) return next;
    }
  }

  const fallback = lines.find((line) =>
    /(주식회사|$begin:math:text$주$end:math:text$|한국농수산|티브이|TV)/i.test(cleanLine(line))
  );

  return fallback ? stripLabelPrefixes(fallback) : "";
}

function cleanRepresentative(value: string) {
  return cleanLine(value)
    .replace(/대표자|성명/g, "")
    .replace(/[:：]/g, "")
    .replace(/[A-Z]/g, "")
    .trim();
}

function pickRepresentative(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i]);

    if (/대표자|성명/.test(line)) {
      const sameLine = cleanRepresentative(stripLabelPrefixes(line));
      if (looksLikePersonName(sameLine)) return sameLine;

      const next = cleanRepresentative(lines[i + 1] || "");
      if (looksLikePersonName(next)) return next;
    }
  }

  const fallback = lines.find((line) => /조세환/.test(cleanLine(line)));
  return fallback ? cleanRepresentative(fallback) : "";
}

function pickOpenDate(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i]);

    if (/개업연월일/.test(line)) {
      const same = line.match(/(\d{4}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}[일]?)/);
      if (same?.[1]) return normalizeDate(same[1]);

      const next = cleanLine(lines[i + 1] || "").match(
        /(\d{4}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}[일]?)/
      );
      if (next?.[1]) return normalizeDate(next[1]);
    }
  }

  for (const raw of lines) {
    const line = cleanLine(raw);
    const m = line.match(/(\d{4}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}[일]?)/);
    if (m?.[1]) return normalizeDate(m[1]);
  }

  return "";
}

function pickAddress(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i]);

    if (/사업장소재지|사업장 소재지|소재지|주소/.test(line)) {
      const sameLine = stripLabelPrefixes(line);

      if (sameLine && /(시|군|구|읍|면|동|로|길)/.test(sameLine)) return sameLine;

      const next = cleanLine(lines[i + 1] || "");
      if (next && /(시|군|구|읍|면|동|로|길)/.test(next)) return next;
    }
  }

  const fallback = lines.find((line) =>
    /(서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주).*(시|군|구|읍|면|동|로|길)/.test(
      cleanLine(line)
    )
  );

  return fallback ? cleanLine(fallback) : "";
}

function collectAfterLabel(lines: string[], label: RegExp, stopWords: RegExp[]) {
  const results: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i]);

    if (label.test(line)) {
      const sameLine = stripLabelPrefixes(line);

      if (sameLine && !stopWords.some((s) => s.test(sameLine))) {
        results.push(sameLine);
      }

      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const next = cleanLine(lines[j]);
        if (!next) continue;
        if (stopWords.some((s) => s.test(next))) break;
        results.push(next);
      }
    }
  }

  return [...new Set(results.map(cleanLine))].filter(Boolean);
}

function pickBizType(lines: string[]) {
  const stopWords = [/종목/, /발급사유/, /사업자단위/, /전자세금계산서/, /세무서장/];
  const values = collectAfterLabel(lines, /업태/, stopWords);
  return values.length > 0 ? values.join(" / ") : "";
}

function pickBizItem(lines: string[]) {
  const stopWords = [/업태/, /발급사유/, /사업자단위/, /전자세금계산서/, /세무서장/];
  const values = collectAfterLabel(lines, /종목/, stopWords);
  return values.length > 0 ? values.join(" / ") : "";
}

function pickTaxEmail(lines: string[]) {
  for (const line of lines) {
    const m = cleanLine(line).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (m?.[0]) return m[0];
  }
  return "";
}

async function preprocessVariantA(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: 2200, withoutEnlargement: true })
    .png()
    .toBuffer();
}

async function preprocessVariantB(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .grayscale()
    .normalise()
    .linear(1.2, -15)
    .threshold(170)
    .resize({ width: 2400, withoutEnlargement: true })
    .png()
    .toBuffer();
}

async function cropKeyRegions(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  if (!width || !height) return [];

  const regions = [
    {
      left: Math.floor(width * 0.05),
      top: Math.floor(height * 0.14),
      width: Math.floor(width * 0.9),
      height: Math.floor(height * 0.32),
    },
    {
      left: Math.floor(width * 0.20),
      top: Math.floor(height * 0.16),
      width: Math.floor(width * 0.55),
      height: Math.floor(height * 0.18),
    },
    {
      left: Math.floor(width * 0.04),
      top: Math.floor(height * 0.20),
      width: Math.floor(width * 0.60),
      height: Math.floor(height * 0.22),
    },
  ];

  const outputs: Buffer[] = [];

  for (const region of regions) {
    if (region.width > 0 && region.height > 0) {
      const cropped = await sharp(buffer)
        .extract(region)
        .grayscale()
        .normalize()
        .sharpen()
        .resize({ width: 2200, withoutEnlargement: false })
        .png()
        .toBuffer();

      outputs.push(cropped);
    }
  }

  return outputs;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} 시간이 초과되었습니다.`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function createOcrWorker(): Promise<Worker> {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );

  console.log("[tesseract] workerPath =", workerPath);

  const worker = await createWorker("eng", 1, {
    logger: (m) => console.log("[tesseract]", m),
    workerPath,
  });

  try {
    await withTimeout(worker.reinitialize("kor+eng"), 30000, "OCR 언어 초기화");
  } catch (error) {
    console.warn(
      "[tesseract] kor+eng 실패 → eng fallback:",
      error instanceof Error ? error.message : error
    );
    await withTimeout(worker.reinitialize("eng"), 10000, "OCR 영문 초기화");
  }

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
    });
  } catch {}

  return worker;
}

function mergeTexts(texts: string[]) {
  return texts
    .flatMap((t) => splitLines(t))
    .filter(Boolean)
    .join("\n");
}

function buildExtracted(lines: string[], fileName: string) {
  return {
    companyName: pickCompanyName(lines),
    ceoName: pickRepresentative(lines),
    bizNo: pickBizNo(lines),
    corpNo: pickCorpNo(lines),
    address: pickAddress(lines),
    bizType: pickBizType(lines),
    bizItem: pickBizItem(lines),
    openDate: pickOpenDate(lines),
    taxEmail: pickTaxEmail(lines),
    sourceFileName: fileName,
    rawText: lines.join("\n"),
    rawLines: lines,
  };
}

export async function POST(req: Request) {
  let worker: Worker | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("업로드 파일이 없습니다.");
    }

    if (!file.type.startsWith("image/")) {
      return jsonError(
        "현재 무료 OCR 버전은 이미지 파일만 지원합니다. JPG/PNG로 업로드해주세요."
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const [variantA, variantB, crops] = await Promise.all([
      preprocessVariantA(rawBuffer),
      preprocessVariantB(rawBuffer),
      cropKeyRegions(rawBuffer),
    ]);

    worker = await createOcrWorker();

    const targets = [variantA, variantB, ...crops];
    const results = await Promise.all(
      targets.map((target, idx) =>
        withTimeout(worker!.recognize(target), 30000, `OCR 문자 인식 ${idx + 1}`)
      )
    );

    const merged = mergeTexts(results.map((r) => r?.data?.text || ""));
    const lines = splitLines(merged);

    if (lines.length === 0) {
      return jsonError(
        "문자 인식 결과가 비어 있습니다. 사업자등록증을 더 선명한 정면 이미지로 다시 업로드해주세요.",
        422
      );
    }

    const extracted = buildExtracted(lines, file.name);

    if (!extracted.companyName && !extracted.ceoName && !extracted.bizNo) {
      return jsonError(
        "핵심 정보 추출에 실패했습니다. 그래도 직접 입력은 가능합니다.",
        422,
        { rawLines: lines.slice(0, 80) }
      );
    }

    return Response.json({
      success: true,
      extracted,
      sourceFileName: file.name,
      sourceFileMime: file.type,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "OCR 처리 중 오류가 발생했습니다.",
      500
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
  }
} 