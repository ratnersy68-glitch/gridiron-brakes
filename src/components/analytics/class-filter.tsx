"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function ClassFilter({ classes, value }: { classes: { id: string; name: string }[]; value: string }) {
  const router = useRouter();

  return (
    <Select value={value} onChange={(e) => router.push(e.target.value ? `/analytics?classId=${e.target.value}` : "/analytics")} className="w-auto">
      <option value="">All classes</option>
      {classes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
