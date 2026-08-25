import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { initials, round1, formatDate } from "@/lib/utils";
import { letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, Profile, SubmissionScore, Topic } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id, full_name, email").eq("id", params.studentId).returns<Pick<Profile, "id" | "full_name" | "email">[]>().maybeSingle();
  if (!profile) notFound();

  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id).returns<Pick<ClassRow, "id" | "name">[]>();
  const classIds = (classes ?? []).map((c) => c.id);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const { data: membership } = await supabase.from("class_members").select("class_id").eq("student_id", params.studentId).in("class_id", classIds);
  if (!membership || membership.length === 0) notFound();
  const studentClassIds = membership.map((m) => m.class_id);

  const [{ data: scores }, { data: assignments }, { data: topics }] = await Promise.all([
    supabase.from("submission_scores").select("*").eq("student_id", params.studentId).in("class_id", studentClassIds).returns<SubmissionScore[]>(),
    supabase.from("assignments").select("*").in("class_id", studentClassIds).returns<Assignment[]>(),
    supabase.from("topics").select("*").returns<Topic[]>()
  ]);

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));
  const scoreList = (scores ?? []).filter((s) => assignmentById.has(s.assignment_id));

  const gradedSorted = scoreList
    .filter((s) => s.percentage !== null)
    .sort((a, b) => (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""));

  const overallAvg = gradedSorted.length ? round1(gradedSorted.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / gradedSorted.length) : null;

  const trendData = gradedSorted.map((s) => ({
    label: assignmentById.get(s.assignment_id)?.name.slice(0, 14) ?? "—",
    value: s.percentage ?? 0
  }));

  // Trend direction: compare average of first half vs second half of graded work.
  let trend: "up" | "down" | "flat" = "flat";
  if (gradedSorted.length >= 2) {
    const mid = Math.floor(gradedSorted.length / 2);
    const first = gradedSorted.slice(0, mid || 1);
    const second = gradedSorted.slice(mid);
    const firstAvg = first.reduce((s, x) => s + (x.percentage ?? 0), 0) / first.length;
    const secondAvg = second.reduce((s, x) => s + (x.percentage ?? 0), 0) / second.length;
    if (secondAvg - firstAvg > 2) trend = "up";
    else if (firstAvg - secondAvg > 2) trend = "down";
  }

  const missing = scoreList.filter((s) => s.status === "missing");
  const late = scoreList.filter((s) => s.is_late);

  const topicPcts = new Map<string, number[]>();
  gradedSorted.forEach((s) => {
    const topicId = assignmentById.get(s.assignment_id)?.topic_id;
    const name = topicId ? topicNameById.get(topicId) ?? "Uncategorized" : "Uncategorized";
    if (!topicPcts.has(name)) topicPcts.set(name, []);
    topicPcts.get(name)!.push(s.percentage ?? 0);
  });
  const topicAverages = Array.from(topicPcts.entries())
    .map(([name, pcts]) => ({ name, avg: round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) }))
    .sort((a, b) => b.avg - a.avg);
  const strongest = topicAverages.slice(0, 3);
  const weakest = [...topicAverages].reverse().slice(0, 3);

  const history = [...scoreList].sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));

  return (
    <div className="space-y-6">
      <Link href="/students" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> All students
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
          {initials(profile.full_name)}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{profile.full_name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <p className="mt-0.5 text-xs text-slate-400">{studentClassIds.map((id) => classNameById.get(id)).join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Overall Grade</p>
          <p className={`mt-1.5 text-2xl font-semibold ${percentageColor(overallAvg)}`}>
            {overallAvg !== null ? `${overallAvg}%` : "—"} {overallAvg !== null && <span className="text-base">({letterGrade(overallAvg)})</span>}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            {trend === "up" && (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Improving
              </>
            )}
            {trend === "down" && (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" /> Declining
              </>
            )}
            {trend === "flat" && "Steady"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Missing Assignments</p>
          <p className="mt-1.5 text-2xl font-semibold text-rose-600">{missing.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Late Assignments</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-600">{late.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={trendData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strongest Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strongest.length === 0 ? (
              <p className="text-xs text-slate-400">No graded work yet.</p>
            ) : (
              strongest.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{t.name}</span>
                  <span className={`font-medium ${percentageColor(t.avg)}`}>{t.avg}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weakest Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakest.length === 0 ? (
              <p className="text-xs text-slate-400">No graded work yet.</p>
            ) : (
              weakest.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{t.name}</span>
                  <span className={`font-medium ${percentageColor(t.avg)}`}>{t.avg}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={TrendingUp} title="No assignments yet" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((s) => {
                const a = assignmentById.get(s.assignment_id);
                const letter = letterGrade(s.percentage);
                return (
                  <li key={s.submission_id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link href={`/assignments/${s.assignment_id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                        {a?.name ?? "Assignment"}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {classNameById.get(s.class_id)} · Due {formatDate(a?.due_date)}
                        {s.is_late && " · Late"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === "missing" ? (
                        <Badge tone="rose">Missing</Badge>
                      ) : s.percentage !== null ? (
                        <>
                          <span className="text-xs text-slate-500">
                            {s.points_earned}/{s.points_possible}
                          </span>
                          <ColorBadge colorClasses={letterGradeColor(letter)}>{s.percentage}% · {letter}</ColorBadge>
                        </>
                      ) : (
                        <Badge tone="amber">{s.status.replace("_", " ")}</Badge>
                      )}
                    </div>
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
