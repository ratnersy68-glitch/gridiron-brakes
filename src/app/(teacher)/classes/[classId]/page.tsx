import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Users, UserPlus, Trash2, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModalButton } from "@/components/ui/form-modal";
import { FormField, Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { CopyCodeButton } from "@/components/classes/copy-code-button";
import { RegenerateCodeButton } from "@/components/classes/regenerate-code-button";
import { round1, initials, formatDate } from "@/lib/utils";
import { letterGrade, percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, Profile, Question, Submission, SubmissionScore, Topic } from "@/types/database";
import { updateClass, addStudentByEmail, removeStudentFromClass } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: { classId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: klass } = await supabase.from("classes").select("*").eq("id", params.classId).returns<ClassRow[]>().maybeSingle();
  if (!klass) notFound();

  const [{ data: members }, { data: assignments }, { data: scores }, { data: submissions }, { data: topics }] = await Promise.all([
    supabase.from("class_members").select("student_id, joined_at, profile:profiles(id, full_name, email)").eq("class_id", klass.id),
    supabase.from("assignments").select("*").eq("class_id", klass.id).returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").eq("class_id", klass.id).returns<SubmissionScore[]>(),
    supabase.from("submissions").select("*, assignment:assignments!inner(class_id)").eq("assignment.class_id", klass.id).returns<(Submission & { assignment: { class_id: string } })[]>(),
    supabase.from("topics").select("*").order("sort_order").returns<Topic[]>()
  ]);

  type MemberRow = { student_id: string; joined_at: string; profile: Pick<Profile, "id" | "full_name" | "email"> | null };
  const roster = (members ?? []) as unknown as MemberRow[];

  const assignmentList = assignments ?? [];
  const assignmentIds = assignmentList.map((a) => a.id);
  const assignmentById = new Map(assignmentList.map((a) => [a.id, a]));

  const { data: questions } = assignmentIds.length
    ? await supabase.from("questions").select("id, assignment_id, topic_id, point_value").in("assignment_id", assignmentIds).returns<Pick<Question, "id" | "assignment_id" | "topic_id" | "point_value">[]>()
    : { data: [] as Pick<Question, "id" | "assignment_id" | "topic_id" | "point_value">[] };
  const questionIds = (questions ?? []).map((q) => q.id);
  const topicByQuestion = new Map((questions ?? []).map((q) => [q.id, q.topic_id]));

  const { data: grades } = questionIds.length
    ? await supabase.from("grades").select("question_id, points_earned, points_possible, graded_at").in("question_id", questionIds)
    : { data: [] as { question_id: string; points_earned: number; points_possible: number; graded_at: string | null }[] };

  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));
  const topicStats = new Map<string, { earned: number; possible: number }>();
  (grades ?? []).forEach((g) => {
    if (!g.graded_at) return;
    const topicId = topicByQuestion.get(g.question_id);
    const name = topicId ? topicNameById.get(topicId) ?? "Uncategorized" : "Uncategorized";
    if (!topicStats.has(name)) topicStats.set(name, { earned: 0, possible: 0 });
    const s = topicStats.get(name)!;
    s.earned += Number(g.points_earned);
    s.possible += Number(g.points_possible);
  });
  const topicPerformance = Array.from(topicStats.entries())
    .map(([name, s]) => ({ name, pct: s.possible > 0 ? round1((s.earned / s.possible) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);

  const scoresByStudent = new Map<string, number[]>();
  const scoresByAssignment = new Map<string, number[]>();
  (scores ?? []).forEach((s) => {
    if (s.percentage === null) return;
    if (!scoresByStudent.has(s.student_id)) scoresByStudent.set(s.student_id, []);
    scoresByStudent.get(s.student_id)!.push(s.percentage);
    if (!scoresByAssignment.has(s.assignment_id)) scoresByAssignment.set(s.assignment_id, []);
    scoresByAssignment.get(s.assignment_id)!.push(s.percentage);
  });

  const allPcts = (scores ?? []).map((s) => s.percentage).filter((p): p is number => p !== null);
  const classAverage = allPcts.length ? round1(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;

  const buckets = [
    { label: "A (90-100)", tone: "bg-emerald-500", count: allPcts.filter((p) => p >= 90).length },
    { label: "B (80-89)", tone: "bg-sky-500", count: allPcts.filter((p) => p >= 80 && p < 90).length },
    { label: "C (70-79)", tone: "bg-amber-500", count: allPcts.filter((p) => p >= 70 && p < 80).length },
    { label: "D (60-69)", tone: "bg-orange-500", count: allPcts.filter((p) => p >= 60 && p < 70).length },
    { label: "F (<60)", tone: "bg-rose-500", count: allPcts.filter((p) => p < 60).length }
  ];
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  // Missing work: published assignments past due with no submitted/graded submission.
  const submissionMap = new Map<string, Submission>();
  (submissions ?? []).forEach((s) => submissionMap.set(`${s.assignment_id}_${s.student_id}`, s));
  const today = new Date().toISOString().slice(0, 10);
  const missing: { studentId: string; assignmentName: string }[] = [];
  for (const a of assignmentList) {
    if (a.status !== "published" || !a.due_date || a.due_date >= today) continue;
    for (const m of roster) {
      const sub = submissionMap.get(`${a.id}_${m.student_id}`);
      if (!sub || sub.status === "not_started" || sub.status === "missing") {
        missing.push({ studentId: m.student_id, assignmentName: a.name });
      }
    }
  }
  const missingByStudent = new Map<string, number>();
  missing.forEach((m) => missingByStudent.set(m.studentId, (missingByStudent.get(m.studentId) ?? 0) + 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{klass.name}</h2>
            {klass.archived && <Badge tone="slate">Archived</Badge>}
          </div>
          <p className="text-sm text-slate-500">{klass.subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FormModalButton
            trigger={<Button variant="outline">Edit class</Button>}
            title="Edit class information"
            action={updateClass.bind(null, klass.id)}
            submitLabel="Save changes"
            successMessage="Class updated"
          >
            <FormField label="Class name">
              <Input name="name" defaultValue={klass.name} required />
            </FormField>
            <FormField label="Subject">
              <Input name="subject" defaultValue={klass.subject} />
            </FormField>
          </FormModalButton>
          <Link href={`/assignments/new?classId=${klass.id}`}>
            <Button>
              <ClipboardList className="h-4 w-4" /> New assignment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Class Code</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-2xl font-semibold tracking-widest text-slate-900">{klass.class_code}</span>
            <CopyCodeButton code={klass.class_code} />
          </div>
          <div className="mt-2">
            <RegenerateCodeButton classId={klass.id} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Class Average</p>
          <p className={`mt-1.5 text-2xl font-semibold ${percentageColor(classAverage)}`}>{classAverage !== null ? `${classAverage}%` : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">{allPcts.length} graded submissions</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Roster</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-semibold text-slate-900">
            <Users className="h-5 w-5 text-slate-400" /> {roster.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">{assignmentList.length} assignments</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-slate-500">{b.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${b.tone}`} style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                </div>
                <span className="w-6 text-right font-medium text-slate-700">{b.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topicPerformance.length === 0 ? (
              <p className="text-xs text-slate-400">No graded work yet.</p>
            ) : (
              topicPerformance.map((t) => (
                <div key={t.name} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 truncate text-slate-500">{t.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${t.pct < 70 ? "bg-rose-500" : t.pct < 85 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className={`w-10 text-right font-medium ${percentageColor(t.pct)}`}>{t.pct}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Averages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assignmentList.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ClipboardList} title="No assignments yet" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {assignmentList.map((a) => {
                const pcts = scoresByAssignment.get(a.id) ?? [];
                const avg = pcts.length ? round1(pcts.reduce((x, y) => x + y, 0) / pcts.length) : null;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link href={`/assignments/${a.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-500">{a.total_points} pts · Due {formatDate(a.due_date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${percentageColor(avg)}`}>{avg !== null ? `${avg}%` : "—"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <FormModalButton
            trigger={
              <Button variant="outline" size="sm">
                <UserPlus className="h-3.5 w-3.5" /> Add student
              </Button>
            }
            title="Add a student"
            description="The student must already have an account. Otherwise, share your class code so they can join themselves."
            action={addStudentByEmail.bind(null, klass.id)}
            submitLabel="Add student"
            successMessage="Student added"
            size="sm"
          >
            <FormField label="Student email">
              <Input name="email" type="email" placeholder="student@school.edu" required />
            </FormField>
          </FormModalButton>
        </CardHeader>
        <CardContent className="p-0">
          {roster.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Users} title="No students yet" description={`Share the class code ${klass.class_code} with your students.`} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-5 py-2.5 font-medium">Student</th>
                    <th className="px-5 py-2.5 font-medium">Average</th>
                    <th className="px-5 py-2.5 font-medium">Missing</th>
                    <th className="px-5 py-2.5 font-medium">Joined</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((m) => {
                    if (!m.profile) return null;
                    const pcts = scoresByStudent.get(m.student_id) ?? [];
                    const avg = pcts.length ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
                    const missingCount = missingByStudent.get(m.student_id) ?? 0;
                    return (
                      <tr key={m.student_id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-2.5">
                          <Link href={`/students/${m.student_id}`} className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-brand-600">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {initials(m.profile.full_name)}
                            </span>
                            {m.profile.full_name}
                          </Link>
                        </td>
                        <td className={`px-5 py-2.5 font-medium ${percentageColor(avg)}`}>{avg !== null ? `${avg}% (${letterGrade(avg)})` : "—"}</td>
                        <td className="px-5 py-2.5">{missingCount > 0 ? <Badge tone="rose">{missingCount} missing</Badge> : <span className="text-slate-400">None</span>}</td>
                        <td className="px-5 py-2.5 text-slate-500">{formatDate(m.joined_at)}</td>
                        <td className="px-5 py-2.5 text-right">
                          <ConfirmButton
                            label={<Trash2 className="h-3.5 w-3.5" />}
                            size="icon"
                            variant="ghost"
                            title={`Remove ${m.profile.full_name}?`}
                            description="This removes them from the class roster. Their grade history is preserved."
                            confirmLabel="Remove"
                            successMessage="Student removed"
                            onConfirm={removeStudentFromClass.bind(null, klass.id, m.student_id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
