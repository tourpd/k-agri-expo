import Link from "next/link";
import { ExploreGroup } from "@/types/expo";
import ExpoSectionTitle from "./ExpoSectionTitle";

interface Props {
  explore: ExploreGroup[];
}

export default function ExpoExploreHub({ explore }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <ExpoSectionTitle
        title="어떤 문제를 해결하고 싶으십니까?"
        subtitle="제품 나열이 아니라 상황과 목적 중심으로 탐색하게 만듭니다"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {explore.map((group) => (
          <div
            key={group.key}
            className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5"
          >
            <h3 className="text-lg font-bold text-neutral-900">{group.title}</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-green-300 hover:text-green-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}