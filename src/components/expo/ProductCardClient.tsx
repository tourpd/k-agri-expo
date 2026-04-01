"use client";

import Link from "next/link";
import { sendExpoLog } from "@/lib/expoLog";

type Props = {
  product_id: string;
  booth_id: string;
  name: string;
  href: string;
};

export default function ProductCardClient({
  product_id,
  booth_id,
  name,
  href,
}: Props) {
  async function handleClick() {
    await sendExpoLog({
      event_type: "product_click",
      target_type: "product",
      target_id: product_id,
      booth_id,
      product_id,
      meta: { name },
    });
  }

  return (
    <Link href={href} onClick={handleClick}>
      {name}
    </Link>
  );
}