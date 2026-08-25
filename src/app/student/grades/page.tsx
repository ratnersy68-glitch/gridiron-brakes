import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { formatDate, round1 } from "@/lib/utils";
import { letterGrade, letterGradeColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase.from("class_members").select("class_id, classes(id, name)").eq("student_id", user.id);
  type MembershipRow = { class_id: string; classes: Pick<ClassRow, "id" | "name"> | null };
  const classIds = ((memberships ?? []) as unknown as MembershipRow[]).map((m) => m.class_id);
  const classNameById = new Map(((memberships ?? []) as unknown as MembershipRow[]).map((m) => [m.class_id, m.classes?.name ?? ""]));

  if (classIds.length === 0) {
    return <EmptyState icon={Award} title="No grades yet" description="Join a class to see your grades here." />;
  }

  const [{ data: scores }, { data: assignments }] = await Promise.all([
    supabase.from("submission_scores").select("*").eq("student_id", user.id).in("class_id", classIds).returns<SubmissionScore[]>(),
    supabase.from("assignments").select("*").in("class_id", classIds).returns<Assignment[]>()
  ]);

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const graded = (scores ?? []).filter((s) => s.percentage !== null && s.fully_graded).sort((a, b) => (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""));

  const trendData = graded.map((s) => ({ label: assignmentById.get(s.assignment_id)?.name.slice(0, 14) ?? "—", value: s.percentage ?? 0 }));
  const overallAvg = graded.length ? round1(graded.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / graded.length) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grade Trend Over Time</CardTitle>
          {overallAvg !== null && <span className="text-sm font-semibold text-slate-700">{overallAvg}% overall</span>}
        </CardHeader>
        <CardContent>
          <TrendLineChart data={trendData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Grades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {graded.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Award} title="No graded work yet" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...graded].reverse().map((s) => {
                const a = assignmentById.get(s.assignment_id);
                const letter = letterGrade(s.percentage);
                return (
                  <li key={s.submission_id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link href={`/student/assignments/${s.assignment_id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                        {a?.name ?? "Assignment"}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {classNameById.get(s.class_id)} · {formatDate(a?.due_date)}
                        {s.is_late && (
                          <Badge tone="amber" className="ml-1.5">
                            Late
                          </Badge>
                        )}
                      </p>
                    </div>
                    <ColorBadge colorClasses={letterGradeColor(letter)}>
                      {s.points_earned}/{s.points_possible} · {s.percentage}% · {letter}
                    </ColorBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
