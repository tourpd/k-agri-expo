import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function FarmerLoginRedirectPage() {
  redirect("/enter/farmer");
}