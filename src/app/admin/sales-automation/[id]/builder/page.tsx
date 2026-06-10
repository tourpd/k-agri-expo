import PageBuilderClient from "@/components/sales-builder/PageBuilderClient";

export const dynamic = "force-dynamic";

export default async function SalesAutomationBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PageBuilderClient projectId={id} />;
}
