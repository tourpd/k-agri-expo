import FarmActionEngineClient from "@/components/admin/FarmActionEngineClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function FarmActionEnginePage() {
  return <FarmActionEngineClient />;
}
