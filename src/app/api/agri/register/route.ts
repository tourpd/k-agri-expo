import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function onlyNumber(v: unknown) {
  const num = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const supabase = createSupabaseAdminClient();

    const productName = String(formData.get("product_name") || "");
    const varietyName = String(formData.get("variety_name") || "");
    const producerName = String(formData.get("producer_name") || "");
    const producerRegion = String(formData.get("producer_region") || "");
    const storageLocation = String(formData.get("storage_location") || "");
    const storageMethod = String(formData.get("storage_method") || "저온저장");
    const storagePeriod = String(formData.get("storage_period") || "");
    const youtubeUrl = String(formData.get("youtube_url") || "");
    const harvestDate = String(formData.get("harvest_date") || "") || null;

    const totalQuantity = onlyNumber(formData.get("total_quantity"));
    const expectedPrice = onlyNumber(formData.get("expected_price"));
    const largeQuantity = onlyNumber(formData.get("large_quantity"));
    const mediumQuantity = onlyNumber(formData.get("medium_quantity"));
    const smallQuantity = onlyNumber(formData.get("small_quantity"));

    const estimatedValue = totalQuantity * expectedPrice * 1000;

    const { data: asset, error } = await supabase
      .from("agri_assets")
      .insert({
        asset_name: `${producerRegion} ${productName} ${totalQuantity}톤`,
        product_name: productName,
        variety_name: varietyName,
        producer_name: producerName,
        producer_region: producerRegion,
        total_quantity: totalQuantity,
        unit: "톤",
        large_quantity: largeQuantity,
        medium_quantity: mediumQuantity,
        small_quantity: smallQuantity,
        harvest_date: harvestDate,
        storage_location: storageLocation,
        storage_method: storageMethod,
        expected_price: expectedPrice,
        estimated_value: estimatedValue,
        photo_count: 0,
        video_count: 0,
        certificate_count: 0,
        quality_score: 0,
        ai_sales_score: 0,
        recommended_channel: String(formData.get("request_options") || ""),
        memo: ["농민 직접 등록", storagePeriod ? `저장기간: ${storagePeriod}` : "", youtubeUrl ? `유튜브: ${youtubeUrl}` : ""].filter(Boolean).join(" / "),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const groups = [
      { key: "photos", type: "photo" },
      { key: "videos", type: "video" },
      { key: "documents", type: "document" },
    ];

    const savedFiles: any[] = [];

    for (const group of groups) {
      const files = formData.getAll(group.key).filter((x) => x instanceof File) as File[];

      for (const file of files) {
        const path = `${asset.id}/${group.type}/${Date.now()}-${safeName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("agri-asset-files")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
        }

        const { data: publicUrl } = supabase.storage
          .from("agri-asset-files")
          .getPublicUrl(path);

        savedFiles.push({
          asset_id: asset.id,
          file_type: group.type,
          file_name: file.name,
          file_url: publicUrl.publicUrl,
        });
      }
    }

    if (savedFiles.length > 0) {
      const { error: fileError } = await supabase.from("agri_asset_files").insert(savedFiles);
      if (fileError) {
        return NextResponse.json({ ok: false, error: fileError.message }, { status: 500 });
      }
    }

    await supabase
      .from("agri_assets")
      .update({
        photo_count: savedFiles.filter((x) => x.file_type === "photo").length,
        video_count: savedFiles.filter((x) => x.file_type === "video").length,
        certificate_count: savedFiles.filter((x) => x.file_type === "document").length,
      })
      .eq("id", asset.id);

    return NextResponse.json({ ok: true, item: asset });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "농산물 등록 실패" },
      { status: 500 }
    );
  }
}
