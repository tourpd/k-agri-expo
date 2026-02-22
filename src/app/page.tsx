import BoothsListClient from "@/app/BoothsListClient";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>K-Agri Expo (상시 온라인 농업 박람회)</h1>
      <p>현재 등록된 업체:</p>
      <BoothsListClient />
    </main>
  );
}