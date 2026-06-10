import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd(), "data", "ai-pdf-jobs");
const CACHE_ROOT = path.join(process.cwd(), "data", "ai-pdf-cache");
const MAX = 28 * 1024 * 1024;

type Job = {
  partialProducts?: any[];
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  fileName: string;
  fileSize: number;
  currentChunk: number;
  totalChunks: number;
  progress: number;
  message: string;
  result: any;
  error: string | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
};

const dir = (id: string) => path.join(ROOT, id);
const jsonFile = (id: string) => path.join(dir(id), "job.json");

async function readJob(id: string): Promise<Job> {
  return JSON.parse(await fs.readFile(jsonFile(id), "utf8"));
}

async function writeJob(job: Job) {
  job.updatedAt = new Date().toISOString();
  await fs.writeFile(jsonFile(job.id), JSON.stringify(job, null, 2));
}

async function updateJob(id: string, message: string, patch: Partial<Job> = {}) {
  const job = await readJob(id);
  Object.assign(job, patch);
  job.message = message;
  job.logs = [`${new Date().toLocaleTimeString()} ${message}`, ...(job.logs ?? [])].slice(0, 120);
  await writeJob(job);
}

async function savePartialProducts(id: string, products: any[]) {
  const job = await readJob(id);
  job.partialProducts = products;
  await writeJob(job);
}

async function makeChunk(src: PDFDocument, start: number, end: number) {
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, Array.from({ length: end - start + 1 }, (_, i) => start + i));
  pages.forEach((p) => doc.addPage(p));
  return await doc.save();
}

async function splitPdf(buffer: Buffer) {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = src.getPageCount();
  const chunks: any[] = [];
  let start = 0;

  while (start < totalPages) {
    let end = start;
    let good: any = null;

    while (end < totalPages) {
      const bytes = await makeChunk(src, start, end);
      if (bytes.length <= MAX) {
        good = { start, end, bytes };
        end++;
      } else break;
    }

    if (!good) throw new Error(`단일 페이지가 28MB 초과: ${start + 1}`);
    chunks.push(good);
    start = good.end + 1;
  }

  return { totalPages, chunks };
}

async function uploadPdf(bytes: Uint8Array, name: string) {
  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("file", new Blob([bytes as any], { type: "application/pdf" }), name);

  const res = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.id;
}

async function ask(fileId: string, prompt: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_file", file_id: fileId },
        ],
      }],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.output_text ?? json.output?.[0]?.content?.[0]?.text ?? "";
}

function parseJson(text: string) {
  return JSON.parse(text.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim());
}

export async function createPdfJob(file: File) {
  const id = crypto.randomUUID();
  await fs.mkdir(dir(id), { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir(id), "source.pdf"), buffer);

  const job: Job = {
    id,
    status: "queued",
    fileName: file.name,
    fileSize: file.size,
    currentChunk: 0,
    totalChunks: 0,
    progress: 0,
    message: "분석 대기중",
    result: null,
    error: null,
    logs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeJob(job);
  return id;
}

export async function getPdfJob(id: string) {
  return await readJob(id);
}

export async function runPdfJob(id: string) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 없습니다.");

    await updateJob(id, "PDF 분석 시작", { status: "running", progress: 3 });

    const job = await readJob(id);
    const buffer = await fs.readFile(path.join(dir(id), "source.pdf"));

    await updateJob(id, `PDF 읽기 완료 ${Math.round(buffer.length / 1024 / 1024)}MB`, { progress: 5 });

    const { totalPages, chunks } = await splitPdf(buffer);

    await updateJob(id, `${totalPages}페이지를 ${chunks.length}개 조각으로 분할 완료`, {
      totalChunks: chunks.length,
      progress: 10,
    });

    const products: any[] = [];
    const chunkReports: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const current = i + 1;

      await updateJob(id, `조각 ${current}/${chunks.length} 업로드중`, {
        currentChunk: current,
        progress: 10 + Math.round((i / chunks.length) * 70),
      });

      const fileId = await uploadPdf(c.bytes, `${job.fileName}_part_${current}.pdf`);

      await updateJob(id, `조각 ${current}/${chunks.length} AI 분석중`, {
        currentChunk: current,
      });

      const text = await ask(fileId, `
첨부 PDF 조각에서 실제 제품만 추출하라. 추측 금지. JSON만 반환.

형식:
{"products":[{"name":"","category":"","crops":[],"problems":[],"reason":""}],"notes":[]}
`);

      const parsed = parseJson(text);
      products.push(...(parsed.products ?? []));
      await savePartialProducts(id, products);

      chunkReports.push({
        part: current,
        pages: `${c.start + 1}-${c.end + 1}`,
        productCount: parsed.products?.length ?? 0,
      });

      await updateJob(id, `조각 ${current}/${chunks.length} 완료 / 누적 제품 ${products.length}개`, {
        currentChunk: current,
        progress: 10 + Math.round((current / chunks.length) * 70),
        partialProducts: products,
      });
    }

    await updateJob(id, "전체 제품 통합 및 1개·10개·20개 구성 생성중", { progress: 88 });

    const finalText = await ask(
      await uploadPdf(Buffer.from(JSON.stringify(products), "utf8") as any, "products.json"),
      `
아래 제품 목록을 중복 제거하고 대표상품 1개, 기본 10개, 확장 20개, 공동구매 순위를 만들어라.
JSON만 반환.

형식:
{
 "allProducts":[{"name":"","category":"","crops":[],"problems":[],"reason":""}],
 "onePick":{"name":"","reason":"","campaign":""},
 "tenPack":[{"name":"","reason":""}],
 "twentyPack":[{"name":"","reason":""}],
 "groupBuyRanking":[{"rank":1,"name":"","reason":""}],
 "contentStrategy":[""],
 "warnings":[""]
}
`
    );

    const analysis = parseJson(finalText);
    const done = await readJob(id);

    done.status = "completed";
    done.progress = 100;
    done.message = "분석 완료";
    done.result = {
      fileName: done.fileName,
      fileSize: done.fileSize,
      pageCount: totalPages,
      chunkCount: chunks.length,
      chunkReports,
      analysis,
    };

    await writeJob(done);

    try {
      await fs.mkdir(CACHE_ROOT, { recursive: true });
      const hash = (await fs.readFile(path.join(dir(id), "hash.txt"), "utf8")).trim();
      await fs.writeFile(
        path.join(CACHE_ROOT, `${hash}.json`),
        JSON.stringify(done.result, null, 2)
      );
    } catch {}
  } catch (error) {
    const job = await readJob(id);
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "PDF 분석 실패";
    job.message = "분석 실패";
    job.logs = [`${new Date().toLocaleTimeString()} 오류: ${job.error}`, ...(job.logs ?? [])];
    await writeJob(job);
  }
}
