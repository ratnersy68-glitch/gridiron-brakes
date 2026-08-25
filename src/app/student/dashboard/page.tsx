import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ClipboardList, TrendingUp, KeyRound, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, round1 } from "@/lib/utils";
import { letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase.from("class_members").select("class_id, classes(id, name, subject)").eq("student_id", user.id);
  type MembershipRow = { class_id: string; classes: Pick<ClassRow, "id" | "name" | "subject"> | null };
  const classRows = ((memberships ?? []) as unknown as MembershipRow[]).map((m) => m.classes).filter((c): c is Pick<ClassRow, "id" | "name" | "subject"> => !!c);

  if (classRows.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          icon={KeyRound}
          title="Join your first class"
          description="Ask your teacher for a class code to get started."
          action={
            <Link href="/student/join">
              <Button>Join a class</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const classIds = classRows.map((c) => c.id);
  const classNameById = new Map(classRows.map((c) => [c.id, c.name]));

  const [{ data: assignments }, { data: scores }] = await Promise.all([
    supabase.from("assignments").select("*").in("class_id", classIds).eq("status", "published").returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").eq("student_id", user.id).in("class_id", classIds).returns<SubmissionScore[]>()
  ]);

  const scoreByAssignment = new Map((scores ?? []).map((s) => [s.assignment_id, s]));
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = (assignments ?? [])
    .filter((a) => {
      const s = scoreByAssignment.get(a.id);
      const notDone = !s || s.status === "not_started" || s.status === "in_progress";
      return notDone && a.due_date && a.due_date >= today;
    })
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5);

  const graded = (scores ?? []).filter((s) => s.percentage !== null);
  const overallAvg = graded.length ? round1(graded.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / graded.length) : null;

  const recentGrades = [...graded].sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "")).slice(0, 5);
  const missingCount = (scores ?? []).filter((s) => s.status === "missing").length;
  const assignmentNameById = new Map((assignments ?? []).map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Classes" value={classRows.length} icon={BookOpen} tone="brand" />
        <StatCard label="Upcoming Assignments" value={upcoming.length} icon={ClipboardList} tone="sky" />
        <StatCard label="Overall Grade" value={overallAvg !== null ? `${overallAvg}%` : "—"} icon={TrendingUp} tone={overallAvg !== null && overallAvg < 70 ? "rose" : "emerald"} />
        <StatCard label="Missing Work" value={missingCount} icon={Clock} tone={missingCount > 0 ? "rose" : "slate"} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcoming.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={ClipboardList} title="Nothing due soon" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link href={`/student/assignments/${a.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {classNameById.get(a.class_id)} · Due {formatDate(a.due_date)}
                      </p>
                    </div>
                    <Link href={`/student/assignments/${a.id}`}>
                      <Button size="sm" variant="outline">
                        Start
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentGrades.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={TrendingUp} title="No graded work yet" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentGrades.map((s) => {
                  const letter = letterGrade(s.percentage);
                  return (
                    <li key={s.submission_id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{assignmentNameById.get(s.assignment_id) ?? "Assignment"}</p>
                        <p className="text-xs text-slate-500">{classNameById.get(s.class_id)}</p>
                      </div>
                      <ColorBadge colorClasses={letterGradeColor(letter)}>{s.percentage}% · {letter}</ColorBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classRows.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-500">{c.subject}</p>
              {(() => {
                const pcts = (scores ?? []).filter((s) => s.class_id === c.id && s.percentage !== null).map((s) => s.percentage as number);
                const avg = pcts.length ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
                return avg !== null ? <p className={`mt-1 text-sm font-medium ${percentageColor(avg)}`}>{avg}% average</p> : <p className="mt-1 text-xs text-slate-400">No grades yet</p>;
              })()}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
