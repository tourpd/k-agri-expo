import React from "react";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ExpoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    redirect("/login/admin");
  }

  return <>{children}</>;
}