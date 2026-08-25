import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Pencil, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublishToggle } from "@/components/assignments/publish-toggle";
import { formatDate, initials, round1 } from "@/lib/utils";
import { letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, Question, SubmissionScore, Topic } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", params.assignmentId).returns<Assignment[]>().maybeSingle();
  if (!assignment) notFound();

  const [{ data: klass }, { data: questions }, { data: scores }, { data: members }] = await Promise.all([
    supabase.from("classes").select("*").eq("id", assignment.class_id).returns<ClassRow[]>().maybeSingle(),
    supabase.from("questions").select("*").eq("assignment_id", assignment.id).order("order_index").returns<Question[]>(),
    supabase.from("submission_scores").select("*").eq("assignment_id", assignment.id).returns<SubmissionScore[]>(),
    supabase.from("class_members").select("student_id, profile:profiles(id, full_name)").eq("class_id", assignment.class_id)
  ]);

  const { data: topicRow } = assignment.topic_id ? await supabase.from("topics").select("*").eq("id", assignment.topic_id).returns<Topic[]>().maybeSingle() : { data: null };

  type MemberRow = { student_id: string; profile: { id: string; full_name: string } | null };
  const roster = (members ?? []) as unknown as MemberRow[];
  const scoreByStudent = new Map((scores ?? []).map((s) => [s.student_id, s]));

  const pcts = (scores ?? []).map((s) => s.percentage).filter((p): p is number => p !== null);
  const avg = pcts.length ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const needsGrading = (scores ?? []).filter((s) => s.status === "submitted" && !s.fully_graded).length;
  const needsReview = (scores ?? []).filter((s) => s.needs_review).length;

  return (
    <div className="space-y-6">
      <Link href="/assignments" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> All assignments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{assignment.name}</h2>
            <Badge tone={assignment.status === "published" ? "emerald" : "slate"}>{assignment.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {klass?.name} · {topicRow?.name ?? "General"} · <span className="capitalize">{assignment.difficulty}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" /> Assigned {formatDate(assignment.date_assigned)} · Due {formatDate(assignment.due_date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PublishToggle assignmentId={assignment.id} status={assignment.status} />
          <Link href={`/assignments/${assignment.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
          <Link href={`/assignments/${assignment.id}/grade`}>
            <Button>
              <ClipboardCheck className="h-4 w-4" /> Grade submissions
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Points</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">{assignment.total_points}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Class Average</p>
          <p className={`mt-1.5 text-2xl font-semibold ${percentageColor(avg)}`}>{avg !== null ? `${avg}%` : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Waiting to Grade</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-600">{needsGrading}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Needs Teacher Review</p>
          <p className="mt-1.5 text-2xl font-semibold text-violet-600">{needsReview}</p>
        </Card>
      </div>

      {assignment.instructions && (
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">Instructions</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{assignment.instructions}</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {(questions ?? []).map((q, i) => (
              <li key={q.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium text-slate-500">{i + 1}.</span> {q.question_text}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-slate-500">{q.point_value} pts</span>
                </div>
                {q.correct_answer && (
                  <p className="mt-1 text-xs text-slate-400">
                    Answer key: <span className="font-mono text-slate-600">{q.correct_answer}</span>
                    {q.answer_type === "manual" && " · Teacher review"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {roster.map((m) => {
              if (!m.profile) return null;
              const score = scoreByStudent.get(m.student_id);
              const letter = letterGrade(score?.percentage ?? null);
              return (
                <li key={m.student_id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(m.profile.full_name)}
                    </span>
                    {m.profile.full_name}
                  </span>
                  {!score || score.status === "not_started" ? (
                    <Badge tone="slate">Not started</Badge>
                  ) : score.status === "missing" ? (
                    <Badge tone="rose">Missing</Badge>
                  ) : score.fully_graded ? (
                    <ColorBadge colorClasses={letterGradeColor(letter)}>
                      {score.points_earned}/{score.points_possible} · {letter}
                    </ColorBadge>
                  ) : (
                    <Badge tone="amber">{score.status === "submitted" ? "Needs grading" : "In progress"}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
