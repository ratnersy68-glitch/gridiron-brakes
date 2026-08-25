import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { computePercentage, letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import { formatDateTime, round1 } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ReviewRow {
  questionText: string;
  pointValue: number;
  correctAnswer: string | null;
  explanation: string | null;
  studentAnswer: string | null;
  pointsEarned: number | null;
  pointsPossible: number;
  comment: string | null;
}

export function AssignmentReview({
  assignmentName,
  className,
  totalPoints,
  isLate,
  submittedAt,
  feedback,
  rows
}: {
  assignmentName: string;
  className: string;
  totalPoints: number;
  isLate: boolean;
  submittedAt: string | null;
  feedback: string;
  rows: ReviewRow[];
}) {
  const earned = round1(rows.reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0));
  const possible = rows.reduce((sum, r) => sum + r.pointsPossible, 0) || totalPoints;
  const percentage = computePercentage(earned, possible);
  const letter = letterGrade(percentage);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{assignmentName}</h2>
            <p className="text-sm text-slate-500">
              {className} · Submitted {formatDateTime(submittedAt)}
              {isLate && (
                <Badge tone="amber" className="ml-1.5">
                  Late
                </Badge>
              )}
            </p>
          </div>
          <ColorBadge colorClasses={letterGradeColor(letter)}>
            {earned}/{possible} · {percentage !== null ? `${percentage}%` : "—"} · {letter}
          </ColorBadge>
        </div>
      </Card>

      {feedback && (
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Teacher feedback</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{feedback}</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r, i) => {
            const isCorrect = r.pointsEarned !== null && r.pointsEarned >= r.pointsPossible;
            const isWrong = r.pointsEarned !== null && r.pointsEarned <= 0;
            return (
              <div key={i} className={cn("rounded-lg border p-4", isCorrect ? "border-emerald-200 bg-emerald-50/40" : isWrong ? "border-rose-200 bg-rose-50/40" : "border-amber-200 bg-amber-50/40")}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium text-slate-500">{i + 1}.</span> {r.questionText}
                  </p>
                  <span className={`shrink-0 text-xs font-semibold ${percentageColor(computePercentage(r.pointsEarned ?? 0, r.pointsPossible))}`}>
                    {r.pointsEarned ?? 0}/{r.pointsPossible}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-md bg-white px-3 py-2">
                    <span className="text-slate-400">Your answer: </span>
                    <span className="font-mono text-slate-700">{r.studentAnswer || "(blank)"}</span>
                  </div>
                  {r.correctAnswer && (
                    <div className="rounded-md bg-white px-3 py-2">
                      <span className="text-slate-400">Correct answer: </span>
                      <span className="font-mono text-slate-700">{r.correctAnswer}</span>
                    </div>
                  )}
                </div>
                {r.explanation && <p className="mt-2 text-xs text-slate-500">{r.explanation}</p>}
                {r.comment && <p className="mt-2 text-xs italic text-slate-600">&ldquo;{r.comment}&rdquo;</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
