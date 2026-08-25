"use client";

import { usePathname } from "next/navigation";
import { Topnav } from "@/components/layout/topnav";
import type { NavItem } from "@/components/layout/sidebar";

export function TeacherTopnav({ items, userName, userEmail }: { items: NavItem[]; userName: string; userEmail: string }) {
  const pathname = usePathname();
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  return <Topnav items={items} brandLabel="Gridiron Grading" title={active?.label ?? "Gridiron Grading"} userName={userName} userEmail={userEmail} />;
}
