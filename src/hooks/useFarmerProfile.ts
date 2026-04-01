"use client";

import { useEffect, useState } from "react";

export type FarmerProfile = {
  farmer_session_id: string | null;
  name: string;
  phone: string;
  region: string;
  crop: string;
  is_verified: boolean;
};

export function useFarmerProfile() {
  const [item, setItem] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/farmer/me", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!mounted) return;

        if (!res.ok || !json?.success) {
          setItem(null);
          return;
        }

        setItem(json.item || null);
      } catch {
        if (!mounted) return;
        setItem(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { farmer: item, loading };
}