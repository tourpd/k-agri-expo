import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_CHUNK_BYTES = 28 * 1024 * 1024;

async function uploadPdfToOpenAI(bytes: Uint8Array, fileName: string) {
  const form = new FormData();
  form.append("purpose", "assistants");
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  form.append("file", new Blob([arrayBuffer], { type: "application/pdf" }), fileName);

  const res = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.id as string;
}

async function askFile(fileId: string, instruction: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: instruction },
            { type: "input_file", file_id: fileId },
          ],
        },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));

  const text = json.output_text ?? json.output?.[0]?.content?.[0]?.text ?? "";
  return text;
}

function parseJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function makePdfChunk(src: PDFDocument, start: number, end: number) {
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, Array.from({ length: end - start + 1 }, (_, i) => start + i));
  pages.forEach((p) => doc.addPage(p));
  return await doc.save();
}

async function splitPdf(buffer: Buffer) {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = src.getPageCount();
  const chunks: { start: number; end: number; bytes: Uint8Array }[] = [];

  let start = 0;

  while (start < total) {
    let end = start;
    let lastGood: { end: number; bytes: Uint8Array } | null = null;

    while (end < total) {
      const bytes = await makePdfChunk(src, start, end);
      if (bytes.length <= MAX_CHUNK_BYTES) {
        lastGood = { end, bytes };
        end++;
        continue;
      }
      break;
    }

    if (!lastGood) {
      const single = await makePdfChunk(src, start, start);
      if (single.length > MAX_CHUNK_BYTES) {
        throw new Error(`단일 페이지가 28MB를 초과합니다. page=${start + 1}`);
      }
      chunks.push({ start, end: start, bytes: single });
      start++;
    } else {
      chunks.push({ start, end: lastGood.end, bytes: lastGood.bytes });
      start = lastGood.end + 1;
    }
  }

  return { totalPages: total, chunks };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY가 없습니다." }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "PDF 파일이 없습니다." }, { status: 400 });
    }

    console.log("[PDF] 업로드 완료:", file.name, file.size);

const buffer = Buffer.from(await file.arrayBuffer());

console.log("[PDF] 버퍼 생성 완료:", Math.round(buffer.length/1024/1024), "MB");
    console.log("[PDF] splitPdf 시작");

const { totalPages, chunks } = await splitPdf(buffer);

console.log("[PDF] splitPdf 완료", totalPages, "pages", chunks.length, "chunks");

    const partialProducts: any[] = [];
    const chunkReports: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const chunkName = `${file.name.replace(/\.pdf$/i, "")}_part_${i + 1}_${c.start + 1}-${c.end + 1}.pdf`;
      console.log(`[PDF] OpenAI 업로드 시작 ${i+1}/${chunks.length}`);

const fileId = await uploadPdfToOpenAI(c.bytes, chunkName);

console.log(`[PDF] OpenAI 업로드 완료 ${i+1}/${chunks.length} fileId=${fileId}`);

      const instruction = `
첨부된 PDF 조각은 전체 카탈로그의 ${c.start + 1}~${c.end + 1}페이지다.
PDF에 실제로 보이는 제품만 추출하라. 추측 금지.
반드시 JSON만 반환하라.

형식:
{
  "products":[
    {"name":"","category":"","crops":[],"problems":[],"reason":""}
  ],
  "notes":[""]
}
`;

      console.log(`[PDF] AI 분석 시작 ${i+1}/${chunks.length}`);

const text = await askFile(fileId, instruction);

console.log(`[PDF] AI 분석 완료 ${i+1}/${chunks.length}`);
      const parsed = parseJson(text);

      console.log(
  `[PDF] 조각 ${i + 1}/${chunks.length} 분석 완료 (${c.start + 1}-${c.end + 1}페이지)`
);

chunkReports.push({
        part: i + 1,
        pages: `${c.start + 1}-${c.end + 1}`,
        productCount: parsed.products?.length ?? 0,
      });

      partialProducts.push(...(parsed.products ?? []));
    }

    const mergePrompt = `
아래는 대형 농자재 카탈로그를 여러 조각으로 나누어 분석한 제품 목록이다.
중복 제품은 합치고, PDF 근거가 약한 것은 warnings에 넣어라.
현 시점 농민 수요 기준으로 대표상품 1개, 기본 구성 10개, 확장 구성 20개, 공동구매 추천순위를 만들어라.
반드시 JSON만 반환하라.

JSON 형식:
{
  "allProducts":[{"name":"","category":"","crops":[],"problems":[],"reason":""}],
  "onePick":{"name":"","reason":"","campaign":""},
  "tenPack":[{"name":"","reason":""}],
  "twentyPack":[{"name":"","reason":""}],
  "groupBuyRanking":[{"rank":1,"name":"","reason":""}],
  "contentStrategy":[""],
  "warnings":[""]
}

분석된 제품 목록:
${JSON.stringify(partialProducts).slice(0, 120000)}
`;

    const mergeRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        input: mergePrompt,
      }),
    });

    const mergeJson = await mergeRes.json();
    if (!mergeRes.ok) {
      return NextResponse.json({ ok: false, error: "통합 분석 실패", detail: mergeJson }, { status: 500 });
    }

    const outputText = mergeJson.output_text ?? mergeJson.output?.[0]?.content?.[0]?.text ?? "";
    const analysis = parseJson(outputText);

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      fileSize: file.size,
      pageCount: totalPages,
      chunkCount: chunks.length,
      chunkReports,
      textLength: 0,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "PDF 분석 실패" },
      { status: 500 }
    );
  }
}
