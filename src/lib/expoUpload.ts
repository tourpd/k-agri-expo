import { supabaseBrowser } from "@/lib/supabase/client";

export async function uploadExpoImage(file: File, folder = "home-slots") {
  const supabase = supabaseBrowser();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("expo-assets")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("expo-assets").getPublicUrl(filename);

  return data.publicUrl;
}