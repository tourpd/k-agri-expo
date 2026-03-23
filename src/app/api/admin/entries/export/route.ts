import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function escapeCsv(value: unknown) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("event_id");
    const keyword = (searchParams.get("keyword") || "").trim();
    const region = (searchParams.get("region") || "").trim();
    const crop = (searchParams.get("crop") || "").trim();

    let query = supabase
      .from("event_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventId && !isNaN(Number(eventId))) {
      query = query.eq("event_id", Number(eventId));
    }

    if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    if (crop) {
      query = query.ilike("crop", `%${crop}%`);
    }

    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,phone.ilike.%${keyword}%,entry_code.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      return new Response("export error", { status: 500 });
    }

    const rows = data || [];

    const header = [
      "id",
      "event_id",
      "name",
      "phone",
      "entry_code",
      "region",
      "crop",
      "created_at",
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.event_id,
          escapeCsv(row.name),
          escapeCsv(row.phone),
          escapeCsv(row.entry_code),
          escapeCsv(row.region),
          escapeCsv(row.crop),
          escapeCsv(row.created_at),
        ].join(",")
      ),
    ].join("\n");

    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="event-entries.csv"`,
      },
    });
  } catch {
    return new Response("server error", { status: 500 });
  }
}