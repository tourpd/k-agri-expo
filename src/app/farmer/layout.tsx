import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user, profile } = await getCurrentUserAndProfile();

    // 로그인 안된 경우
    if (!user) {
      return <>{children}</>;
    }

    // 농민 계정이 아닌 경우
    if (profile && profile.role !== "farmer") {
      redirect("/login");
    }

    return <>{children}</>;
  } catch (error) {
    console.error("[FarmerLayout]", error);

    // 개발 중에는 막지 말고 통과
    return <>{children}</>;
  }
}