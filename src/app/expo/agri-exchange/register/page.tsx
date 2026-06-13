import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import RegisterFormClient from "./RegisterFormClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "agri-assets";

async function uploadFiles(assetId: string, files: File[], fileType: "photo" | "document") {
  "use server";

  const supabase = createSupabaseAdminClient();
  const saved = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;

    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const path = `${assetId}/${fileType}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    saved.push({
      agri_asset_id: assetId,
      file_type: fileType,
      file_url: data.publicUrl,
      file_name: file.name,
    });
  }

  return saved;
}

async function createAsset(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const total_quantity = Number(formData.get("total_quantity") ?? 0);
  const expected_price = Number(formData.get("expected_price") ?? 0);
  const estimated_value = total_quantity * expected_price;

  const memo = String(formData.get("memo") ?? "").trim();

  const specMemo = `
[규격별 재고·가격]
대: ${formData.get("spec_대_stock") ?? ""} / ${formData.get("spec_대_price") ?? ""} / ${formData.get("spec_대_value") ?? ""} / ${formData.get("spec_대_channel") ?? ""}
중: ${formData.get("spec_중_stock") ?? ""} / ${formData.get("spec_중_price") ?? ""} / ${formData.get("spec_중_value") ?? ""} / ${formData.get("spec_중_channel") ?? ""}
소: ${formData.get("spec_소_stock") ?? ""} / ${formData.get("spec_소_price") ?? ""} / ${formData.get("spec_소_value") ?? ""} / ${formData.get("spec_소_channel") ?? ""}
`.trim();

  const youtube_url = String(formData.get("youtube_url") ?? "").trim();
  const storage_status = String(formData.get("storage_status") ?? "").trim();

  const { data, error } = await supabase
    .from("agri_assets")
    .insert({
      asset_name: String(formData.get("asset_name") ?? "").trim(),
      product_name: String(formData.get("product_name") ?? "").trim(),
      variety_name: String(formData.get("variety_name") ?? "").trim(),
      producer_name: String(formData.get("producer_name") ?? "").trim(),
      producer_region: String(formData.get("producer_region") ?? "").trim(),
      harvest_date: String(formData.get("harvest_date") ?? "") || null,
      main_grade: String(formData.get("main_grade") ?? "").trim(),
      size_spec: String(formData.get("size_spec") ?? "").trim(),
      total_quantity,
      unit: String(formData.get("unit") ?? "톤").trim(),
      expected_price,
      estimated_value,
      storage_location: String(formData.get("storage_location") ?? "").trim(),
      storage_method: String(formData.get("storage_method") ?? "").trim(),
      memo: `${storage_status}\n\n${memo}\n\n${specMemo}`.trim(),
      youtube_url,
      status: String(formData.get("status") ?? "거래가능"),
      photo_count: 0,
      certificate_count: 0,
      video_count: youtube_url ? 1 : 0,
      quality_score: 80,
      ai_sales_score: 80,
      recommended_channel: "K-Agri 농산물거래소",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const assetId = data.id;

  const photos = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  const documents = formData.getAll("documents").filter((v): v is File => v instanceof File && v.size > 0);

  const photoRows = await uploadFiles(assetId, photos, "photo");
  const documentRows = await uploadFiles(assetId, documents, "document");

  const fileRows = [
    ...photoRows,
    ...documentRows,
    ...(youtube_url
      ? [{
          agri_asset_id: assetId,
          file_type: "video",
          file_url: youtube_url,
          file_name: "유튜브 영상",
        }]
      : []),
  ];

  if (fileRows.length > 0) {
    await supabase.from("agri_asset_files").insert(fileRows);
  }

  await supabase
    .from("agri_assets")
    .update({
      photo_count: photoRows.length,
      certificate_count: documentRows.length,
      video_count: youtube_url ? 1 : 0,
    })
    .eq("id", assetId);

  redirect(`/admin/agri-assets/${assetId}`);
}

export default function Page() {
  return <RegisterFormClient createAsset={createAsset} />;
}
