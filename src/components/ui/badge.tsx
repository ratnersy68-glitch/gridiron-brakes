import { cn } from "@/lib/utils";

type Tone = "slate" | "emerald" | "sky" | "amber" | "rose" | "brand" | "violet";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-500/10",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20"
};

export function Badge({ tone = "slate", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

/** For badges whose color comes from a computed Tailwind class string (e.g. letter-grade
 *  colors) rather than a fixed `Tone` — kept separate from `Badge` so the two class sets
 *  never merge and fight over which background/text color wins. */
export function ColorBadge({ colorClasses, className, children }: { colorClasses: string; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", colorClasses, className)}>
      {children}
    </span>
  );
}
