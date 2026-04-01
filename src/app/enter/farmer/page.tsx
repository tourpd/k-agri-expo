import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FarmerEntryClientPage from "./FarmerEntryClientPage";

export const dynamic = "force-dynamic";

const FARMER_ENTRY_COOKIE = "kagri_farmer_entry";

export default async function FarmerEntryPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FARMER_ENTRY_COOKIE)?.value;

  if (raw) {
    try {
      const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));

      if (parsed?.phone) {
        redirect("/expo");
      }
    } catch {}
  }

  return <FarmerEntryClientPage />;
}