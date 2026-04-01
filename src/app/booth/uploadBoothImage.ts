import type { SupabaseClient } from '@supabase/supabase-js';

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

/* ================================
   1️⃣ Storage 업로드
================================ */
export async function uploadBoothImage(params: {
  supabase: SupabaseClient;
  boothId: string;
  file: File;
}) {
  const { supabase, boothId, file } = params;

  const safeName = sanitizeFilename(file.name);
  const path = `booths/${boothId}/images/${nowStamp()}_${safeName}`;

  const { error } = await supabase.storage
    .from('booth-assets')
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (error) throw error;

  return path;
}

/* ================================
   2️⃣ DB 저장
================================ */
export async function insertBoothImageRow(
  supabase: SupabaseClient,
  boothId: string,
  filePath: string
) {
  const { error } = await supabase.from('booth_images').insert({
    booth_id: boothId,
    file_path: filePath,
  });

  if (error) throw error;
}

/* ================================
   3️⃣ 통합 실행
================================ */
export async function submitBoothImage(params: {
  supabase: SupabaseClient;
  boothId: string;
  file: File;
}) {
  const { supabase, boothId, file } = params;

  const path = await uploadBoothImage({ supabase, boothId, file });
  await insertBoothImageRow(supabase, boothId, path);

  return path;
}

/* ================================
   4️⃣ Public URL 변환
================================ */
export function getBoothPublicUrl(
  supabase: SupabaseClient,
  filePath: string
) {
  const { data } = supabase.storage
    .from('booth-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}