"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export function SearchBox({
  placeholder,
  defaultValue,
  paramKey = "q"
}: {
  placeholder: string;
  defaultValue?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Read the live query string directly rather than via useSearchParams(),
      // which would force every page rendering this input into a Suspense boundary.
      const params = new URLSearchParams(window.location.search);
      if (value) params.set(paramKey, value);
      else params.delete(paramKey);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [value, paramKey, pathname, router]);

  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}
