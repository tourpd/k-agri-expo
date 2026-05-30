import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

type AssetType =
  | "logo"
  | "banner"
  | "product"
  | "event"
  | "catalog"
  | "manual";

function safeSlug(v: string) {
  return (
    String(v || "brand")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  );
}

function isAllowedAssetType(v: string): v is AssetType {
  return ["logo", "banner", "product", "event", "catalog", "manual"].includes(v);
}

function isPdf(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function getFolder(assetType: AssetType) {
  switch (assetType) {
    case "logo":
      return "logo";
    case "banner":
      return "banner";
    case "product":
      return "products";
    case "event":
      return "events";
    case "catalog":
      return "catalogs";
    case "manual":
      return "manuals";
    default:
      return "files";
  }
}

function getImageSpec(assetType: AssetType) {
  if (assetType === "logo") {
    return {
      width: 600,
      height: 600,
      fit: "contain" as const,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      quality: 90,
    };
  }

  if (assetType === "banner") {
    return {
      width: 1800,
      height: 620,
      fit: "cover" as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      quality: 90,
    };
  }

  if (assetType === "product") {
    return {
      width: 1200,
      height: 1200,
      fit: "contain" as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      quality: 90,
    };
  }

  if (assetType === "event") {
    return {
      width: 1400,
      height: 788,
      fit: "contain" as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      quality: 90,
    };
  }

  return {
    width: 1400,
    height: 1400,
    fit: "contain" as const,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
    quality: 90,
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const rawAssetType = String(formData.get("asset_type") || "product");
    const brandSlug = safeSlug(String(formData.get("brand_slug") || "brand"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "업로드 파일이 없습니다." },
        { status: 400 }
      );
    }

    if (!isAllowedAssetType(rawAssetType)) {
      return NextResponse.json(
        { ok: false, error: "asset_type 오류" },
        { status: 400 }
      );
    }

    if (!isPdf(file) && !isImage(file)) {
      return NextResponse.json(
        {
          ok: false,
          error: "이미지 파일 또는 PDF 파일만 업로드할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    const assetType = rawAssetType as AssetType;
    const supabase = createSupabaseAdminClient();
    const folder = getFolder(assetType);

    if (isPdf(file)) {
      const path = `brands/${brandSlug}/${folder}/${assetType}-${Date.now()}.pdf`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "0",
      });

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return NextResponse.json({
        ok: true,
        asset_type: assetType,
        file_type: "pdf",
        path,
        public_url: `${data.publicUrl}?v=${Date.now()}`,
      });
    }

    const spec = getImageSpec(assetType);
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(spec.width, spec.height, {
        fit: spec.fit,
        background: spec.background,
        withoutEnlargement: false,
      })
      .webp({ quality: spec.quality })
      .toBuffer();

    const path = `brands/${brandSlug}/${folder}/${assetType}-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, outputBuffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "0",
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      asset_type: assetType,
      file_type: "image",
      path,
      public_url: `${data.publicUrl}?v=${Date.now()}`,
      width: spec.width,
      height: spec.height,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "업로드 중 오류 발생",
      },
      { status: 500 }
    );
  }
}