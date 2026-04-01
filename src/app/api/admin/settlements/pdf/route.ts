import PDFDocument from "pdfkit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatKrw(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const settlementId = url.searchParams.get("settlement_id");

    if (!settlementId) {
      return Response.json({ error: "settlement_id 필요" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("vendor_settlements")
      .select("*")
      .eq("settlement_id", settlementId)
      .single();

    if (error || !data) {
      return Response.json({ error: "정산 데이터 없음" }, { status: 404 });
    }

    const doc = new PDFDocument({ margin: 50 });

    const buffers: any[] = [];
    doc.on("data", buffers.push.bind(buffers));

    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
    });

    // 🔥 제목
    doc.fontSize(20).text("정산서", { align: "center" });
    doc.moveDown();

    // 🔥 기본 정보
    doc.fontSize(12);
    doc.text(`업체 ID: ${data.vendor_id}`);
    doc.text(`정산 기간: ${data.period_start} ~ ${data.period_end}`);
    doc.moveDown();

    // 🔥 금액 정보
    doc.text(`총 매출: ${formatKrw(data.total_sales_krw)}`);
    doc.text(`수수료 (${data.commission_rate * 100}%): ${formatKrw(data.commission_amount_krw)}`);
    doc.text(`지급 금액: ${formatKrw(data.payout_amount_krw)}`);
    doc.moveDown();

    // 🔥 주문 수
    doc.text(`주문 수: ${data.order_count}건`);
    doc.moveDown();

    // 🔥 안내문 (세무 핵심)
    doc.fontSize(10).text(
      "※ 본 매출은 공급업체의 매출이며, 한국농수산TV는 판매대행 수수료만 수익으로 처리됩니다.",
      { align: "left" }
    );

    doc.end();

    const pdfBuffer = await endPromise;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=settlement-${settlementId}.pdf`,
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "PDF 생성 실패" },
      { status: 500 }
    );
  }
}