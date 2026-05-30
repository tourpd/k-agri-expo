import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function ExpoLiveBroadcastRedirectPage({ params }: PageProps) {
  const { eventId } = await params;

  redirect(`/admin/live-broadcast?eventId=${encodeURIComponent(eventId)}`);
}