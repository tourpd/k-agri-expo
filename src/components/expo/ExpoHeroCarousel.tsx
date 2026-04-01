"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroItem } from "@/types/expo";

interface Props {
  items: HeroItem[];
}

export default function ExpoHeroCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!items.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [items]);

  if (!items.length) return null;

  const active = items[index];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <div
        className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-cover bg-center"
        style={{ backgroundImage: `url(${active.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 px-6 py-12 md:px-10 md:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              운영형 메인 콘텐츠
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-5xl">
              {active.title}
            </h2>
            {active.subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 md:text-lg">
                {active.subtitle}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={active.targetUrl || "#"}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-neutral-900 transition hover:opacity-90"
              >
                {active.buttonText}
              </Link>

              {active.secondaryButtonText ? (
                <Link
                  href="/expo/consult"
                  className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {active.secondaryButtonText}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition ${
                  i === index ? "w-10 bg-white" : "w-2.5 bg-white/50"
                }`}
                aria-label={`${i + 1}번 슬라이드`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}