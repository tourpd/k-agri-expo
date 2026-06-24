// src/app/admin/farmer-crm/page.tsx

import { createClient } from "@supabase/supabase-js";
import FarmerCrmClient from "./FarmerCrmClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type FarmerCrmRow = {
  key: string;
  name: string;
  phone: string;
  region: string;
  crop: string;
  farmSize: string;
  orderCount: number;
  totalQuantity: number;
  latestOrderId: string;
  latestProduct: string;
  latestStatus: string;
  latestDate: string;
  latestRawDate: string;
  memo: string;

  profileStage: string;
  lastNoteDate: string;
  nextContactDate: string;
  repurchaseScore: number;
  repurchaseLabel: string;
};

type FarmerNoteRow = {
  id: string;
  phone?: string | null;
  farmer_name?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type FarmerProfileRow = {
  id: string;
  phone?: string | null;
  farmer_name?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  stage?: string | null;
  last_contact_at?: string | null;
  next_contact_at?: string | null;
  repurchase_score?: number | null;
  memo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function numberValue(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pyeong(v: unknown) {
  const s = safe(v);
  if (!s) return "-";
  if (s.includes("평")) return s;
  return `${s}평`;
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function dateOnly(v?: string | null) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

function daysBetween(date?: string | null) {
  if (!date) return 999;

  const now = new Date();
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return 999;

  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function calcRepurchaseScore(orderCount: number, latestDate?: string | null, hasNote = false) {
  let score = 0;

  score += orderCount * 15;

  const days = daysBetween(latestDate);

  if (days <= 30) score += 40;
  else if (days <= 60) score += 25;
  else if (days <= 90) score += 10;

  if (hasNote) score += 20;

  return Math.min(score, 100);
}

function repurchaseLabel(score: number) {
  if (score >= 80) return "★★★★★";
  if (score >= 60) return "★★★★☆";
  if (score >= 40) return "★★★☆☆";
  if (score >= 20) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function nextContactDateFromNote(lastNoteDate?: string | null) {
  if (!lastNoteDate) return "-";

  const d = new Date(lastNoteDate);

  if (Number.isNaN(d.getTime())) return "-";

  d.setDate(d.getDate() + 7);

  return d.toISOString().slice(0, 10);
}

async function getLatestNoteMap() {
  const { data, error } = await supabase
    .from("farmer_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) return new Map<string, FarmerNoteRow>();

  const noteMap = new Map<string, FarmerNoteRow>();

  for (const note of (data || []) as FarmerNoteRow[]) {
    const phone = phoneOnly(note.phone);

    if (!phone) continue;
    if (noteMap.has(phone)) continue;

    noteMap.set(phone, note);
  }

  return noteMap;
}

async function getProfileMap() {
  const { data, error } = await supabase
    .from("farmer_profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10000);

  if (error) return new Map<string, FarmerProfileRow>();

  const profileMap = new Map<string, FarmerProfileRow>();

  for (const profile of (data || []) as FarmerProfileRow[]) {
    const phone = phoneOnly(profile.phone);

    if (!phone) continue;
    if (profileMap.has(phone)) continue;

    profileMap.set(phone, profile);
  }

  return profileMap;
}

async function getRows(): Promise<FarmerCrmRow[]> {
  const noteMap = await getLatestNoteMap();
  const profileMap = await getProfileMap();

  const { data, error } = await supabase
    .from("expo_brand_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, FarmerCrmRow>();

  for (const row of data || []) {
    const phone = phoneOnly(row.phone);
    const key = phone || safe(row.farmer_name) || String(row.id);

    const note = noteMap.get(phone);
    const profile = profileMap.get(phone);

    const prev = map.get(key);

    if (!prev) {
      const baseScore = calcRepurchaseScore(1, row.created_at, !!note);
      const profileScore = Number(profile?.repurchase_score || 0);
      const score = Math.max(baseScore, profileScore);

      const profileNextContact = dateOnly(profile?.next_contact_at);
      const noteNextContact = note?.created_at
        ? nextContactDateFromNote(note.created_at)
        : "-";

      map.set(key, {
        key,

        name: safe(profile?.farmer_name) || safe(row.farmer_name) || "-",
        phone: phone || "-",

        region:
          safe(profile?.region) ||
          safe(row.address) ||
          safe(row.base_address) ||
          "-",

        crop: safe(profile?.crop) || safe(row.crop) || "-",

        farmSize: safe(profile?.farm_size) || pyeong(row.farm_size),

        orderCount: 1,
        totalQuantity: numberValue(row.quantity),
        latestOrderId: String(row.id),

        latestProduct: safe(row.product_name) || "주문상품",

        latestStatus:
          safe(row.order_status) ||
          safe(row.payment_status) ||
          "신청접수",

        latestDate: shortDate(row.created_at),
        latestRawDate: safe(row.created_at),

        memo:
          safe(profile?.memo) ||
          safe(row.memo) ||
          safe(row.vendor_memo) ||
          "-",

        profileStage: safe(profile?.stage) || "신규",

        lastNoteDate: note?.created_at ? shortDate(note.created_at) : "-",

        nextContactDate:
          profileNextContact !== "-"
            ? profileNextContact
            : noteNextContact,

        repurchaseScore: score,
        repurchaseLabel: repurchaseLabel(score),
      });

      continue;
    }

    prev.orderCount += 1;
    prev.totalQuantity += numberValue(row.quantity);

    if (prev.crop === "-" && safe(row.crop)) prev.crop = safe(row.crop);

    if (prev.region === "-" && (safe(row.address) || safe(row.base_address))) {
      prev.region = safe(row.address) || safe(row.base_address);
    }

    if (prev.farmSize === "-" && safe(row.farm_size)) {
      prev.farmSize = pyeong(row.farm_size);
    }

    if (prev.memo === "-" && (safe(row.memo) || safe(row.vendor_memo))) {
      prev.memo = safe(row.memo) || safe(row.vendor_memo);
    }

    const updatedNote = noteMap.get(phone);
    const updatedProfile = profileMap.get(phone);

    const updatedBaseScore = calcRepurchaseScore(
      prev.orderCount,
      prev.latestRawDate,
      !!updatedNote
    );

    const updatedProfileScore = Number(updatedProfile?.repurchase_score || 0);
    const updatedScore = Math.max(updatedBaseScore, updatedProfileScore);

    const updatedProfileNextContact = dateOnly(updatedProfile?.next_contact_at);
    const updatedNoteNextContact = updatedNote?.created_at
      ? nextContactDateFromNote(updatedNote.created_at)
      : "-";

    prev.profileStage = safe(updatedProfile?.stage) || prev.profileStage || "신규";

    prev.lastNoteDate = updatedNote?.created_at
      ? shortDate(updatedNote.created_at)
      : "-";

    prev.nextContactDate =
      updatedProfileNextContact !== "-"
        ? updatedProfileNextContact
        : updatedNoteNextContact;

    prev.repurchaseScore = updatedScore;
    prev.repurchaseLabel = repurchaseLabel(updatedScore);
  }

  for (const [phone, profile] of profileMap.entries()) {
    if (map.has(phone)) continue;

    const note = noteMap.get(phone);
    const score = Number(profile.repurchase_score || 0);

    map.set(phone, {
      key: phone,
      name: safe(profile.farmer_name) || "-",
      phone,

      region: safe(profile.region) || "-",
      crop: safe(profile.crop) || "-",
      farmSize: safe(profile.farm_size) || "-",

      orderCount: 0,
      totalQuantity: 0,
      latestOrderId: "-",
      latestProduct: "-",
      latestStatus: "-",
      latestDate: "-",
      latestRawDate: "",

      memo: safe(profile.memo) || "-",

      profileStage: safe(profile.stage) || "신규",

      lastNoteDate: note?.created_at ? shortDate(note.created_at) : "-",

      nextContactDate:
        dateOnly(profile.next_contact_at) !== "-"
          ? dateOnly(profile.next_contact_at)
          : note?.created_at
            ? nextContactDateFromNote(note.created_at)
            : "-",

      repurchaseScore: score,
      repurchaseLabel: repurchaseLabel(score),
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.repurchaseScore !== a.repurchaseScore) {
      return b.repurchaseScore - a.repurchaseScore;
    }

    return b.orderCount - a.orderCount;
  });
}

export default async function Page() {
  try {
    const rows = await getRows();

    return <FarmerCrmClient rows={rows} errorMessage="" />;
  } catch (e: any) {
    return (
      <FarmerCrmClient
        rows={[]}
        errorMessage={e?.message || "CRM 데이터를 불러오지 못했습니다."}
      />
    );
  }
}