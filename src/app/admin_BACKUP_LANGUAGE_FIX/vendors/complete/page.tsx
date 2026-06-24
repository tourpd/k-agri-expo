type CompletePageProps = {
  searchParams: Promise<{
    company?: string;
    product?: string;
    amount?: string;
  }>;
};

export default async function CompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await searchParams;

  const company = params.company ?? "";
  const product = params.product ?? "";
  const amount = params.amount ?? "";

  return (
    <main style={{ padding: 40 }}>
      <h1>신청 완료</h1>

      <p>회사명: {company || "-"}</p>
      <p>상품: {product || "-"}</p>
      <p>금액: {amount ? `${amount}원` : "-"}</p>

      <div style={{ marginTop: 20, padding: 20, background: "#fff3cd" }}>
        <h3>입금 안내</h3>
        <p>농협 123-456-789012</p>
        <p>예금주: 한국농수산TV</p>
        <p>입금자명: 회사명 동일</p>
      </div>
    </main>
  );
}