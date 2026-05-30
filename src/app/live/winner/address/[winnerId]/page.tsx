import AddressFormClient from "./AddressFormClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ winnerId: string }>;
};

export default async function WinnerAddressPage({ params }: PageProps) {
  const { winnerId } = await params;

  return <AddressFormClient winnerId={winnerId} />;
}