import Link from "next/link";
import { ActionItem } from "@/types/expo";
import ExpoSectionTitle from "./ExpoSectionTitle";

interface Props {
  actions: ActionItem[];
}

export default function ExpoActionHub({ actions }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <ExpoSectionTitle
        title="지금 가장 많이 찾는 기능"
        subtitle="스크롤보다 먼저, 바로 행동할 수 있게 구성했습니다"
      />

      <div className="grid gap-4 md:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-2xl">{action.icon ?? "•"}</div>
            <div className="mt-3 text-lg font-bold text-neutral-900">
              {action.title}
            </div>
            <p className="mt-2 text-sm text-neutral-600">{action.description}</p>
            <div className="mt-5 text-sm font-semibold text-green-700">
              바로가기 →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}