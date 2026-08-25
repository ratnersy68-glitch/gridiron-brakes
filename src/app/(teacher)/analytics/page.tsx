import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassFilter } from "@/components/analytics/class-filter";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { HorizontalBarChart, VerticalBarChart } from "@/components/charts/bar-chart";
import { round1 } from "@/lib/utils";
import { percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, SubmissionScore, Topic } from "@/types/database";

export const dynamic = "force-dynamic";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? round1((sorted[mid - 1] + sorted[mid]) / 2) : round1(sorted[mid]);
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { classId?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classes } = await supabase.from("classes").select("id, teacher_id, name, subject, class_code, archived, created_at, updated_at").eq("teacher_id", user.id).returns<ClassRow[]>();
  if (!classes || classes.length === 0) {
    return <EmptyState icon={BarChart3} title="No data yet" description="Create a class and some assignments to see analytics." />;
  }

  const scopeClassIds = searchParams.classId ? [searchParams.classId] : classes.map((c) => c.id);

  const [{ data: assignments }, { data: scores }, { data: topics }, { data: members }] = await Promise.all([
    supabase.from("assignments").select("*").in("class_id", scopeClassIds).returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").in("class_id", scopeClassIds).returns<SubmissionScore[]>(),
    supabase.from("topics").select("*").order("sort_order").returns<Topic[]>(),
    supabase.from("class_members").select("class_id, student_id").in("class_id", scopeClassIds)
  ]);

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));
  const totalStudents = new Set((members ?? []).map((m) => m.student_id)).size;

  const graded = (scores ?? []).filter((s) => s.percentage !== null) as (SubmissionScore & { percentage: number })[];
  const allPcts = graded.map((s) => s.percentage);

  const classAverage = allPcts.length ? round1(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;
  const medianScore = median(allPcts);
  const highest = allPcts.length ? Math.max(...allPcts) : null;
  const lowest = allPcts.length ? Math.min(...allPcts) : null;

  const distribution = [
    { name: "F", value: allPcts.filter((p) => p < 60).length },
    { name: "D", value: allPcts.filter((p) => p >= 60 && p < 70).length },
    { name: "C", value: allPcts.filter((p) => p >= 70 && p < 80).length },
    { name: "B", value: allPcts.filter((p) => p >= 80 && p < 90).length },
    { name: "A", value: allPcts.filter((p) => p >= 90).length }
  ];

  // Average + per-student breakdown by topic, using each assignment's topic.
  const topicScores = new Map<string, number[]>();
  const topicStudentAvg = new Map<string, Map<string, number[]>>();
  graded.forEach((s) => {
    const topicId = assignmentById.get(s.assignment_id)?.topic_id;
    const name = topicId ? topicNameById.get(topicId) ?? "Uncategorized" : "Uncategorized";
    if (!topicScores.has(name)) topicScores.set(name, []);
    topicScores.get(name)!.push(s.percentage);
    if (!topicStudentAvg.has(name)) topicStudentAvg.set(name, new Map());
    const byStudent = topicStudentAvg.get(name)!;
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, []);
    byStudent.get(s.student_id)!.push(s.percentage);
  });
  const topicAverages = Array.from(topicScores.entries())
    .map(([name, pcts]) => ({ name, value: round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) }))
    .sort((a, b) => a.value - b.value);

  const weakTopics = Array.from(topicStudentAvg.entries())
    .map(([name, byStudent]) => {
      const studentAverages = Array.from(byStudent.values()).map((pcts) => pcts.reduce((a, b) => a + b, 0) / pcts.length);
      const strugglingCount = studentAverages.filter((avg) => avg < 70).length;
      const classAvg = round1(studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length);
      return { name, classAvg, strugglingCount };
    })
    .filter((t) => t.classAvg < 70)
    .sort((a, b) => a.classAvg - b.classAvg);

  const assignmentScores = new Map<string, number[]>();
  graded.forEach((s) => {
    if (!assignmentScores.has(s.assignment_id)) assignmentScores.set(s.assignment_id, []);
    assignmentScores.get(s.assignment_id)!.push(s.percentage);
  });
  const assignmentAverages = Array.from(assignmentScores.entries())
    .map(([id, pcts]) => ({ id, name: assignmentById.get(id)?.name ?? "Assignment", value: round1(pcts.reduce((a, b) => a + b, 0) / pcts.length), date: assignmentById.get(id)?.date_assigned ?? "" }))
    .sort((a, b) => a.value - b.value);

  const progressOverTime = [...assignmentAverages]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({ label: a.name.slice(0, 14), value: a.value }));

  return (
    <div className="space-y-6">
      <ClassFilter classes={classes.map((c) => ({ id: c.id, name: c.name }))} value={searchParams.classId ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Class Average</p>
          <p className={`mt-1.5 text-2xl font-semibold ${percentageColor(classAverage)}`}>{classAverage !== null ? `${classAverage}%` : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Median Score</p>
          <p className={`mt-1.5 text-2xl font-semibold ${percentageColor(medianScore)}`}>{medianScore !== null ? `${medianScore}%` : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Highest Score</p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-600">{highest !== null ? `${highest}%` : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Lowest Score</p>
          <p className="mt-1.5 text-2xl font-semibold text-rose-600">{lowest !== null ? `${lowest}%` : "—"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChart data={distribution} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Class Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={progressOverTime} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average by Math Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={topicAverages} colorForValue={(v) => (v < 70 ? "#f43f5e" : v < 85 ? "#f59e0b" : "#10b981")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average by Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={assignmentAverages.slice(0, 10)} colorForValue={(v) => (v < 70 ? "#f43f5e" : v < 85 ? "#f59e0b" : "#10b981")} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Weak Topics Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weakTopics.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={BarChart3} title="No weak topics detected" description="Every topic is averaging 70% or above." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {weakTopics.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {t.name}: <span className="text-rose-600">{t.classAvg}%</span> class average
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.strugglingCount} of {totalStudents} students may need additional practice
                    </p>
                  </div>
                  <Link href="/students" className="text-xs font-medium text-brand-600 hover:underline">
                    View students
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
