// src/app/vendor/uploadDoc.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type DocType = "business_license" | "corporate_registry";

export type VendorDocRowSafe = {
  id: string;
  vendor_user_id: string;
  doc_type: DocType;
  status: "pending" | "approved" | "rejected";
  file_path: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reject_reason: string | null; // 없을 수도 있으니 안전
};

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

async function uploadToVendorDocsBucket(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  docType: DocType
) {
  const safeName = sanitizeFilename(file.name);
  // ✅ 경로 규칙: vendors/<uid>/<docType>/<timestamp>_파일명
  const path = `vendors/${userId}/${docType}/${nowStamp()}_${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("vendor-docs")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (upErr) throw upErr;
  return path;
}

async function insertVendorDocRow(
  supabase: SupabaseClient,
  userId: string,
  docType: DocType,
  filePath: string
) {
  const { error } = await supabase.from("vendor_docs").insert({
    vendor_user_id: userId,
    doc_type: docType,
    status: "pending",
    file_path: filePath,
  });

  if (error) throw error;
}

export async function submitVendorDocs(params: {
  supabase: SupabaseClient;
  userId: string;
  bizType: "individual" | "corporation";
  companyName: string;
  ceoName: string;
  bizNo: string;
  bizFile: File;
  corpFile: File | null;
}) {
  const { supabase, userId, bizType, bizFile, corpFile } = params;

  // 1) 사업자등록증 업로드 + row insert
  const bizPath = await uploadToVendorDocsBucket(
    supabase,
    userId,
    bizFile,
    "business_license"
  );
  await insertVendorDocRow(supabase, userId, "business_license", bizPath);

  // 2) 법인등기(선택)
  if (bizType === "corporation" && corpFile) {
    const corpPath = await uploadToVendorDocsBucket(
      supabase,
      userId,
      corpFile,
      "corporate_registry"
    );
    await insertVendorDocRow(supabase, userId, "corporate_registry", corpPath);
  }

  // companyName/ceoName/bizNo 저장은 다음 단계( vendors 테이블 컬럼 확정 후 )
}

export async function fetchMyDocs(
  supabase: SupabaseClient,
  userId: string
): Promise<VendorDocRowSafe[]> {
  // reject_reason이 없을 수도 있어서 안전 처리
  const { data, error } = await supabase
    .from("vendor_docs")
    .select(
      "id,vendor_user_id,doc_type,status,file_path,created_at,reviewed_at,reviewed_by,reject_reason"
    )
    .eq("vendor_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    const msg = (error as any)?.message ?? "";
    if (msg.includes("reject_reason") || msg.includes("schema cache")) {
      const retry = await supabase
        .from("vendor_docs")
        .select("id,vendor_user_id,doc_type,status,file_path,created_at,reviewed_at,reviewed_by")
        .eq("vendor_user_id", userId)
        .order("created_at", { ascending: false });

      if (retry.error) throw retry.error;

      return (retry.data ?? []).map((r: any) => ({
        ...r,
        reject_reason: null,
      })) as VendorDocRowSafe[];
    }
    throw error;
  }

  return (data ?? []).map((r: any) => ({
    ...r,
    reject_reason: r.reject_reason ?? null,
  })) as VendorDocRowSafe[];
}

export async function getSignedDocUrl(
  supabase: SupabaseClient,
  filePath: string
) {
  const { data, error } = await supabase.storage
    .from("vendor-docs")
    .createSignedUrl(filePath, 60 * 10); // 10분

  if (error) throw error;
  return data.signedUrl;
}