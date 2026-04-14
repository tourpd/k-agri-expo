"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function getBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anon) {
    console.error("Supabase browser env missing", {
      hasUrl: !!url,
      hasAnon: !!anon,
    });
    throw new Error(
      "Supabase browser env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, anon };
}

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, anon } = getBrowserEnv();
  browserClient = createBrowserClient(url, anon);

  return browserClient;
}

export function supabaseBrowser() {
  return createSupabaseBrowserClient();
}