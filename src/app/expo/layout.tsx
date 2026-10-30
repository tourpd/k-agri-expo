export const dynamic = "force-dynamic";

import React from "react";
import ExpoShell from "@/components/shell/ExpoShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ExpoShell>{children}</ExpoShell>;
}
