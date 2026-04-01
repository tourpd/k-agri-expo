import Link from "next/link";
import { KATVVideo } from "@/types/expo";
import ExpoSectionTitle from "./ExpoSectionTitle";

interface Props {
  videos: KATVVideo[];
}

export default function ExpoKATVSection({ videos }: Props) {
  if (!videos.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <ExpoSectionTitle
        title="한국농수산TV 추천 콘텐츠"
        subtitle="영상 시청에서 끝나지 않고 제품과 부스로 연결되는 미디어형 박람회 구역입니다"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {videos.map((video) => (
          <div
            key={video.id}
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
          >
            <Link href={video.href}>
              <div
                className="aspect-video bg-cover bg-center"
                style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
              />
            </Link>

            <div className="p-5">
              <Link href={video.href} className="text-lg font-bold text-neutral-900">
                {video.title}
              </Link>

              <div className="mt-4 flex gap-2">
                <Link
                  href={video.href}
                  className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  영상 보기
                </Link>

                {video.boothHref ? (
                  <Link
                    href={video.boothHref}
                    className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
                  >
                    관련 부스
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}