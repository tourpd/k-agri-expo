// src/lib/boothImages.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type BoothImageRow = {
  id: string;
  booth_id: string;
  file_path: string;
  is_primary: boolean;
  created_by: string;
  created_at: string;
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

/**
 * Storage path rule:
 * booths/<booth_id>/images/<timestamp>_filename
 */
export function makeBoothAssetPath(boothId: string, file: File) {
  const safe = sanitizeFilename(file.name);
  return `booths/${boothId}/images/${nowStamp()}_${safe}`;
}

export async function uploadBoothImage(
  supabase: SupabaseClient,
  boothId: string,
  file: File
) {
  const path = makeBoothAssetPath(boothId, file);

  const { error } = await supabase.storage
    .from("booth-assets")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (error) throw error;
  return path;
}

export async function insertBoothImageRow(
  supabase: SupabaseClient,
  boothId: string,
  filePath: string
) {
  const { data, error } = await supabase
    .from("booth_images")
    .insert({
      booth_id: boothId,
      file_path: filePath,
      // is_primary는 일단 false로 넣고, 아래 setPrimary로 정리하는 게 안전합니다.
    })
    .select("id, booth_id, file_path, is_primary, created_by, created_at")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error("insertBoothImageRow: inserted row not returned");
  }

  return data as BoothImageRow;
}

export async function fetchBoothImages(
  supabase: SupabaseClient,
  boothId: string
): Promise<BoothImageRow[]> {
  const { data, error } = await supabase
    .from("booth_images")
    .select("id, booth_id, file_path, is_primary, created_by, created_at")
    .eq("booth_id", boothId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BoothImageRow[];
}

export async function setPrimaryBoothImage(
  supabase: SupabaseClient,
  imageId: string
) {
  const { data, error } = await supabase.rpc("set_primary_booth_image", {
    p_image_id: imageId,
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "set_primary_booth_image failed");
  return data;
}

export async function removeBoothImageRow(
  supabase: SupabaseClient,
  imageId: string
) {
  const { error } = await supabase.from("booth_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function removeBoothAssetObject(
  supabase: SupabaseClient,
  filePath: string
) {
  const { error } = await supabase.storage.from("booth-assets").remove([filePath]);
  if (error) throw error;
}

export async function getSignedBoothAssetUrl(
  supabase: SupabaseClient,
  filePath: string,
  seconds = 60 * 10
) {
  const { data, error } = await supabase.storage
    .from("booth-assets")
    .createSignedUrl(filePath, seconds);

  if (error) throw error;
  return data.signedUrl;
}