import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  product_id?: string | number | null;
  id?: string | number | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_user_id?: string | null;
  vendor_id?: string | null;
};

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(data, {
    headers: noStoreHeaders(),
  });
}

function resolveKey(body: Body): string | number | null {
  const raw = body?.product_id ?? body?.id ?? null;
  if (raw === null || raw === undefined || raw === "") return null;
  return raw;
}

async function getUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error("[api/vendor/products/delete] auth.getUser error:", error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("[api/vendor/products/delete] getUserId exception:", error);
    return null;
  }
}

async function getOwnedBooth(
  boothId: string,
  userId: string
): Promise<BoothRow | null> {
  if (!boothId || !userId) return null;

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("booths")
      .select("booth_id, vendor_user_id, vendor_id")
      .eq("booth_id", boothId)
      .maybeSingle<BoothRow>();

    if (error) {
      console.error("[api/vendor/products/delete] booth lookup error:", error);
      return null;
    }

    if (!data?.booth_id) return null;

    const isOwner = data.vendor_user_id === userId || data.vendor_id === userId;

    return isOwner ? data : null;
  } catch (error) {
    console.error("[api/vendor/products/delete] getOwnedBooth exception:", error);
    return null;
  }
}

async function getOwnedProduct(
  key: string | number,
  userId: string
): Promise<ProductRow | null> {
  const admin = createSupabaseAdminClient();

  try {
    const byProductId = await admin
      .from("expo_products")
      .select("id, product_id, booth_id")
      .eq("product_id", key)
      .maybeSingle<ProductRow>();

    if (!byProductId.error && byProductId.data?.booth_id) {
      const booth = await getOwnedBooth(String(byProductId.data.booth_id), userId);
      if (booth) return byProductId.data;
    } else if (byProductId.error) {
      console.error(
        "[api/vendor/products/delete] lookup by product_id error:",
        byProductId.error
      );
    }
  } catch (error) {
    console.error(
      "[api/vendor/products/delete] lookup by product_id exception:",
      error
    );
  }

  try {
    const byId = await admin
      .from("expo_products")
      .select("id, product_id, booth_id")
      .eq("id", key)
      .maybeSingle<ProductRow>();

    if (!byId.error && byId.data?.booth_id) {
      const booth = await getOwnedBooth(String(byId.data.booth_id), userId);
      if (booth) return byId.data;
    } else if (byId.error) {
      console.error("[api/vendor/products/delete] lookup by id error:", byId.error);
    }
  } catch (error) {
    console.error("[api/vendor/products/delete] lookup by id exception:", error);
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const key = resolveKey(body);

    if (key === null) {
      return jsonError("product_id 또는 id가 필요합니다.", 400);
    }

    const product = await getOwnedProduct(key, userId);

    if (!product) {
      return jsonError("이 제품을 삭제할 권한이 없습니다.", 403);
    }

    const admin = createSupabaseAdminClient();

    if (product.product_id !== null && product.product_id !== undefined) {
      const r1 = await admin
        .from("expo_products")
        .delete()
        .eq("product_id", product.product_id);

      if (!r1.error) {
        return jsonSuccess({
          ok: true,
          success: true,
          mode: "deleted",
          product_id: product.product_id,
          id: product.id ?? null,
        });
      }

      console.error(
        "[api/vendor/products/delete] delete by product_id error:",
        r1.error
      );
    }

    const r2 = await admin
      .from("expo_products")
      .delete()
      .eq("id", product.id ?? key);

    if (r2.error) {
      console.error("[api/vendor/products/delete] delete by id error:", r2.error);
      return jsonError(r2.error.message || "제품 삭제에 실패했습니다.", 500);
    }

    return jsonSuccess({
      ok: true,
      success: true,
      mode: "deleted",
      product_id: product.product_id ?? null,
      id: product.id ?? key,
    });
  } catch (error) {
    console.error("[api/vendor/products/delete] exception:", error);
    return jsonError(
      error instanceof Error ? error.message : "제품 삭제 중 오류가 발생했습니다.",
      500
    );
  }
}