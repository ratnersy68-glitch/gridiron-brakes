export function computePercentage(pointsEarned: number, pointsPossible: number): number | null {
  if (!pointsPossible || pointsPossible <= 0) return null;
  return Math.round((pointsEarned / pointsPossible) * 1000) / 10;
}

export function letterGrade(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined || Number.isNaN(percentage)) return "—";
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

export function letterGradeColor(letter: string): string {
  if (letter.startsWith("A")) return "text-emerald-700 bg-emerald-50 ring-emerald-600/20";
  if (letter.startsWith("B")) return "text-sky-700 bg-sky-50 ring-sky-600/20";
  if (letter.startsWith("C")) return "text-amber-700 bg-amber-50 ring-amber-600/20";
  if (letter.startsWith("D")) return "text-orange-700 bg-orange-50 ring-orange-600/20";
  if (letter === "F") return "text-rose-700 bg-rose-50 ring-rose-600/20";
  return "text-slate-600 bg-slate-50 ring-slate-500/20";
}

export function percentageColor(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return "text-slate-400";
  if (percentage >= 90) return "text-emerald-600";
  if (percentage >= 80) return "text-sky-600";
  if (percentage >= 70) return "text-amber-600";
  if (percentage >= 60) return "text-orange-600";
  return "text-rose-600";
}
