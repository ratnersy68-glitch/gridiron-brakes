import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Users, ClipboardCheck, TrendingUp, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, initials, round1 } from "@/lib/utils";
import { letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, Profile, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, teacher_id, name, subject, class_code, archived, created_at, updated_at")
    .eq("teacher_id", user.id)
    .eq("archived", false)
    .returns<ClassRow[]>();

  const classIds = (classes ?? []).map((c) => c.id);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  if (classIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <EmptyState
          icon={BookOpen}
          title="Create your first class to get started"
          description="Add a class, invite students with a class code, then create your first math assignment."
          action={
            <Link href="/classes">
              <Button>Create a class</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const [{ data: members }, { data: assignments }, { data: scores }] = await Promise.all([
    supabase.from("class_members").select("class_id, student_id").in("class_id", classIds),
    supabase
      .from("assignments")
      .select("id, class_id, name, date_assigned, due_date, total_points, status, topic_id, difficulty, has_answer_key, instructions, created_at, updated_at")
      .in("class_id", classIds)
      .returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").in("class_id", classIds).returns<SubmissionScore[]>()
  ]);

  const totalStudents = new Set((members ?? []).map((m) => m.student_id)).size;
  const assignmentList = assignments ?? [];
  const assignmentNameById = new Map(assignmentList.map((a) => [a.id, a.name]));
  const scoreList = scores ?? [];

  const gradedScores = scoreList.filter((s) => s.percentage !== null);
  const averageGrade = gradedScores.length
    ? round1(gradedScores.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / gradedScores.length)
    : null;

  const waitingToGrade = scoreList.filter((s) => s.status === "submitted" && !s.fully_graded);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = assignmentList
    .filter((a) => a.status === "published" && a.due_date && a.due_date >= today)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5);

  const recentAssignments = [...assignmentList].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5);

  const recentActivity = [...scoreList]
    .filter((s) => s.submitted_at)
    .sort((a, b) => (a.submitted_at! < b.submitted_at! ? 1 : -1))
    .slice(0, 6);

  const studentIdsNeeded = new Set<string>([...recentActivity.map((s) => s.student_id)]);

  // Struggling students: average percentage across graded work, below 70%.
  const byStudent = new Map<string, number[]>();
  for (const s of scoreList) {
    if (s.percentage === null) continue;
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, []);
    byStudent.get(s.student_id)!.push(s.percentage);
  }
  const struggling = Array.from(byStudent.entries())
    .map(([studentId, pcts]) => ({ studentId, avg: round1(pcts.reduce((a, b) => a + b, 0) / pcts.length), count: pcts.length }))
    .filter((s) => s.avg < 70)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);
  struggling.forEach((s) => studentIdsNeeded.add(s.studentId));

  const { data: studentProfiles } = studentIdsNeeded.size
    ? await supabase.from("profiles").select("id, full_name, email").in("id", Array.from(studentIdsNeeded)).returns<Pick<Profile, "id" | "full_name" | "email">[]>()
    : { data: [] as Pick<Profile, "id" | "full_name" | "email">[] };
  const studentNameById = new Map((studentProfiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Classes" value={classes?.length ?? 0} icon={BookOpen} tone="brand" />
        <StatCard label="Total Students" value={totalStudents} icon={Users} tone="sky" />
        <StatCard label="Waiting to Grade" value={waitingToGrade.length} icon={ClipboardCheck} tone="amber" hint={waitingToGrade.length ? "Submissions need review" : "You're all caught up"} />
        <StatCard label="Average Class Grade" value={averageGrade !== null ? `${averageGrade}%` : "—"} icon={TrendingUp} tone={averageGrade !== null && averageGrade < 75 ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <Link href="/assignments" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentAssignments.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={ClipboardCheck} title="No assignments yet" description="Create your first math assignment to start grading." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentAssignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/assignments/${a.id}`} className="truncate text-sm font-medium text-slate-800 hover:text-brand-600">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {classNameById.get(a.class_id)} · {a.total_points} pts · Due {formatDate(a.due_date)}
                      </p>
                    </div>
                    <Badge tone={a.status === "published" ? "emerald" : "slate"}>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcoming.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Clock} title="Nothing due soon" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <Link href={`/assignments/${a.id}`} className="truncate text-sm font-medium text-slate-800 hover:text-brand-600">
                      {a.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {classNameById.get(a.class_id)} · Due {formatDate(a.due_date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Users} title="No submissions yet" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((s) => {
                  const letter = letterGrade(s.percentage);
                  return (
                    <li key={s.submission_id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {initials(studentNameById.get(s.student_id) ?? "?")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">
                          <span className="font-medium">{studentNameById.get(s.student_id) ?? "Student"}</span> submitted{" "}
                          <span className="text-slate-600">{assignmentNameById.get(s.assignment_id)}</span>
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(s.submitted_at)}</p>
                      </div>
                      {s.fully_graded ? (
                        <ColorBadge colorClasses={letterGradeColor(letter)}>{letter}</ColorBadge>
                      ) : (
                        <Badge tone="amber">Needs grading</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Students Who Are Struggling
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {struggling.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={TrendingUp} title="No students below 70% right now" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {struggling.map((s) => (
                  <li key={s.studentId} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link href={`/students/${s.studentId}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                        {studentNameById.get(s.studentId) ?? "Student"}
                      </Link>
                      <p className="text-xs text-slate-500">{s.count} graded assignment{s.count === 1 ? "" : "s"}</p>
                    </div>
                    <span className={`text-sm font-semibold ${percentageColor(s.avg)}`}>{s.avg}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
