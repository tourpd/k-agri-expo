import Link from "next/link";
import { ExpoStats } from "@/types/expo";
import ExpoSectionTitle from "./ExpoSectionTitle";

interface Props {
  stats: ExpoStats;
}

const items = (stats: ExpoStats) => [
  {
    label: "오늘 상담 요청",
    value: `${stats.todayConsultCount}건`,
    href: "/admin/crm",
  },
  {
    label: "HOT 리드",
    value: `${stats.hotLeadCount}건`,
    href: "/admin/crm?filter=hot",
  },
  {
    label: "라이브 진행중",
    value: `${stats.liveNowCount}건`,
    href: "/expo/live",
  },
  {
    label: "마감 임박 특가",
    value: `${stats.endingDealsCount}개`,
    href: "/expo/deals",
  },
];

export default function ExpoLiveStats({ stats }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <ExpoSectionTitle
        title="지금 박람회 상황"
        subtitle="살아 움직이는 플랫폼처럼 보이게 만드는 실시간 운영 존입니다"
      />

      <div className="grid gap-4 md:grid-cols-4">
        {items(stats).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-3xl border border-neutral-200 bg-green-50 p-5 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-medium text-neutral-600">{item.label}</div>
            <div className="mt-3 text-3xl font-extrabold text-neutral-900">
              {item.value}
            </div>
            <div className="mt-4 text-sm font-semibold text-green-700">
              자세히 보기 →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}