import ProductOrdersClient from "./ProductOrdersClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    keyword?: string;
  }>;
};

export default async function AdminProductOrdersPage({
  searchParams,
}: PageProps) {
  const sp = (await searchParams) || {};

  return <ProductOrdersClient initialKeyword={String(sp.keyword || "")} />;
}