import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type BoothRef = {
  booth_id: string;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) {
      console.error("[my-booth] roleError =", roleError);
      return Response.json(
        { ok: false, error: roleError.message || "권한 확인 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    const isVendor = Array.isArray(roleRows)
      ? roleRows.some((row) => row.role === "vendor")
      : false;

    if (!isVendor) {
      return Response.json(
        { ok: false, error: "vendor 권한이 없습니다." },
        { status: 403 }
      );
    }

    const vendorRes = await supabase
      .from("vendors")
      .select("vendor_id,user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (vendorRes.error) {
      console.error("[my-booth] vendorRes.error =", vendorRes.error);
      return Response.json(
        { ok: false, error: vendorRes.error.message },
        { status: 400 }
      );
    }

    const vendor = vendorRes.data?.[0] ?? null;

    if (!vendor?.vendor_id) {
      return Response.json(
        { ok: false, error: "vendor가 없습니다." },
        { status: 404 }
      );
    }

    let body: any = {};

    try {
      body = await req.json();
    } catch (jsonError) {
      console.error("[my-booth] invalid json body =", jsonError);
      return Response.json(
        { ok: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const requestedBoothId = safeString(body?.booth_id);
    let targetBooth: BoothRef | null = null;

    if (requestedBoothId) {
      const boothByIdRes = await supabase
        .from("booths")
        .select("booth_id,vendor_id,vendor_user_id")
        .eq("booth_id", requestedBoothId)
        .limit(1);

      if (boothByIdRes.error) {
        console.error("[my-booth] boothByIdRes.error =", boothByIdRes.error);
        return Response.json(
          { ok: false, error: boothByIdRes.error.message },
          { status: 400 }
        );
      }

      const boothById = (boothByIdRes.data?.[0] ?? null) as BoothRef | null;

      if (!boothById) {
        return Response.json(
          { ok: false, error: "요청한 부스를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const ownedByVendorId = boothById.vendor_id === vendor.vendor_id;
      const ownedByUserId = boothById.vendor_user_id === user.id;

      if (!ownedByVendorId && !ownedByUserId) {
        return Response.json(
          { ok: false, error: "이 부스를 수정할 권한이 없습니다." },
          { status: 403 }
        );
      }

      targetBooth = boothById;
    } else {
      const boothByUserRes = await supabase
        .from("booths")
        .select("booth_id,vendor_id,vendor_user_id")
        .eq("vendor_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (boothByUserRes.error) {
        console.error("[my-booth] boothByUserRes.error =", boothByUserRes.error);
        return Response.json(
          { ok: false, error: boothByUserRes.error.message },
          { status: 400 }
        );
      }

      if (boothByUserRes.data && boothByUserRes.data.length > 0) {
        targetBooth = boothByUserRes.data[0] as BoothRef;
      } else {
        const boothByVendorRes = await supabase
          .from("booths")
          .select("booth_id,vendor_id,vendor_user_id")
          .eq("vendor_id", vendor.vendor_id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (boothByVendorRes.error) {
          console.error("[my-booth] boothByVendorRes.error =", boothByVendorRes.error);
          return Response.json(
            { ok: false, error: boothByVendorRes.error.message },
            { status: 400 }
          );
        }

        if (boothByVendorRes.data && boothByVendorRes.data.length > 0) {
          targetBooth = boothByVendorRes.data[0] as BoothRef;
        }
      }
    }

    if (!targetBooth?.booth_id) {
      return Response.json(
        { ok: false, error: "부스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const patch = {
      name: safeString(body?.name),
      region: safeString(body?.region),
      category_primary: safeString(body?.category_primary),
      intro: safeString(body?.intro),
      description: safeString(body?.description),
      phone: safeString(body?.phone),
      email: safeString(body?.email),
      hall_id: safeString(body?.hall_id),
      updated_at: new Date().toISOString(),
    };

    console.log("[my-booth] user.id =", user.id);
    console.log("[my-booth] vendor.vendor_id =", vendor.vendor_id);
    console.log("[my-booth] requestedBoothId =", requestedBoothId);
    console.log("[my-booth] targetBooth =", targetBooth);
    console.log("[my-booth] patch =", patch);

    const updateRes = await supabase
      .from("booths")
      .update(patch)
      .eq("booth_id", targetBooth.booth_id);

    if (updateRes.error) {
      console.error("[my-booth] updateRes.error =", updateRes.error);
      return Response.json(
        { ok: false, error: updateRes.error.message },
        { status: 400 }
      );
    }

    const refetchRes = await supabase
      .from("booths")
      .select("*")
      .eq("booth_id", targetBooth.booth_id)
      .limit(1);

    if (refetchRes.error) {
      console.error("[my-booth] refetchRes.error =", refetchRes.error);

      return Response.json({
        ok: true,
        booth_id: targetBooth.booth_id,
      });
    }

    const updated = refetchRes.data?.[0] ?? null;

    return Response.json({
      ok: true,
      booth: updated,
      booth_id: targetBooth.booth_id,
    });
  } catch (e: any) {
    console.error("[my-booth] unexpected error =", e);

    return Response.json(
      { ok: false, error: e?.message || "부스 저장 중 오류" },
      { status: 500 }
    );
  }
}